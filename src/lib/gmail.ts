/**
 * Gmail API 호출과 OAuth.
 *
 * 다른 외부 연동과 같이 SDK 없이 fetch 로 부릅니다. 메일을 읽고 라벨을 달아야 해서
 * gmail.modify 권한을 받지만, 여기에는 라벨 변경 외의 쓰기 호출이 없습니다.
 */
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

const SCOPE = "https://www.googleapis.com/auth/gmail.modify";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const API_URL = "https://gmail.googleapis.com/gmail/v1/users/me";
const TIMEOUT_MS = 30 * 1000;

function config() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export const gmailConfigured = () => config() !== null;

const redirectUri = () =>
  `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/mail/oauth/callback`;

// ─────────────────────── 토큰 암호화 ───────────────────────

/** AUTH_SECRET 에서 용도별 키를 뽑습니다. AUTH_SECRET 을 바꾸면 다시 연결해야 합니다 */
function tokenKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET 환경변수가 없습니다.");
  return Buffer.from(hkdfSync("sha256", secret, "", "gmail-refresh-token", 32));
}

export function encryptToken(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((part) => part.toString("base64url"))
    .join(".");
}

function decryptToken(stored: string) {
  const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", tokenKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// ─────────────────────── OAuth ───────────────────────

/** 연결이 끊겨 다시 연결해야 합니다 (권한 취소, 토큰 만료) */
export class GmailAuthError extends Error {}

export class GmailApiError extends Error {
  constructor(readonly status: number) {
    super(`Gmail API ${status}`);
  }
}

export function gmailAuthUrl(state: string) {
  const cfg = config();
  if (!cfg) return null;
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    // refresh token 은 동의 화면을 거칠 때만 나옵니다
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH_URL}?${params}`;
}

async function requestToken(params: Record<string, string>) {
  const cfg = config();
  if (!cfg) throw new GmailAuthError("Google OAuth 설정이 없습니다.");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      ...params,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const data = await res.json().catch(() => null);
  if (res.status === 400 || res.status === 401) {
    throw new GmailAuthError(data?.error ?? "invalid_grant");
  }
  if (!res.ok) throw new GmailApiError(res.status);
  return data as { access_token: string; refresh_token?: string };
}

/** 동의 화면에서 받은 코드 → refresh token(암호화)과 계정 주소 */
export async function exchangeCode(code: string) {
  const token = await requestToken({
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(),
  });
  if (!token.refresh_token) throw new GmailAuthError("refresh token 없음");
  const profile = await gmailFetch<{ emailAddress: string }>(
    token.access_token,
    "/profile",
  );
  return {
    email: profile.emailAddress,
    refreshToken: encryptToken(token.refresh_token),
  };
}

export async function getAccessToken(storedRefreshToken: string) {
  const token = await requestToken({
    grant_type: "refresh_token",
    refresh_token: decryptToken(storedRefreshToken),
  });
  return token.access_token;
}

/** 연결 해제 시 Google 쪽 권한도 취소합니다. 실패해도 연결 해제는 진행합니다 */
export async function revokeToken(storedRefreshToken: string) {
  try {
    await fetch(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: decryptToken(storedRefreshToken) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    console.error("[gmail] 권한 취소 실패", error);
  }
}

// ─────────────────────── Gmail API ───────────────────────

async function gmailFetch<T>(
  accessToken: string,
  path: string,
  init?: { method: "POST"; body: unknown },
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init ? { "Content-Type": "application/json" } : {}),
    },
    body: init ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new GmailApiError(res.status);
  return res.json() as Promise<T>;
}

/** 받은편지함의 메일 ID. 최신순이며, limit 을 넘으면 truncated 가 true 입니다 */
export async function listInboxIds(
  accessToken: string,
  { after, limit }: { after: Date | null; limit: number },
) {
  const q = after
    ? `in:inbox after:${Math.floor(after.getTime() / 1000)}`
    : "in:inbox";
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q,
      maxResults: String(Math.min(100, limit - ids.length)),
      ...(pageToken ? { pageToken } : {}),
    });
    const page = await gmailFetch<{
      messages?: { id: string }[];
      nextPageToken?: string;
    }>(accessToken, `/messages?${params}`);
    ids.push(...(page.messages ?? []).map((message) => message.id));
    pageToken = page.nextPageToken;
  } while (pageToken && ids.length < limit);

  return { ids, truncated: Boolean(pageToken) };
}

type MessagePart = {
  mimeType?: string;
  filename?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: MessagePart[];
};

type GmailMessage = {
  id: string;
  threadId: string;
  internalDate: string;
  payload?: MessagePart;
};

export type ParsedMail = {
  gmailId: string;
  threadId: string;
  fromName: string | null;
  fromEmail: string;
  subject: string;
  receivedAt: Date;
  attachmentNames: string[];
  text: string;
};

export function parseFrom(value: string) {
  const match = value.match(/^\s*"?(.*?)"?\s*<([^<>]+)>\s*$/);
  if (match) return { name: match[1].trim() || null, email: match[2].trim() };
  return { name: null, email: value.trim() };
}

export function htmlToText(html: string) {
  return html
    .replace(/<(style|script|head)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<(br|\/p|\/div|\/tr|\/li|\/h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

export function parseMessage(message: GmailMessage): ParsedMail {
  const plain: string[] = [];
  const html: string[] = [];
  const attachmentNames: string[] = [];

  const walk = (part: MessagePart | undefined) => {
    if (!part) return;
    if (part.filename) {
      attachmentNames.push(part.filename);
      return;
    }
    if (part.body?.data) {
      const decoded = Buffer.from(part.body.data, "base64url").toString("utf8");
      if (part.mimeType === "text/plain") plain.push(decoded);
      if (part.mimeType === "text/html") html.push(decoded);
    }
    part.parts?.forEach(walk);
  };
  walk(message.payload);

  const header = (name: string) =>
    message.payload?.headers?.find(
      (h) => h.name.toLowerCase() === name.toLowerCase(),
    )?.value ?? "";
  const from = parseFrom(header("From"));

  return {
    gmailId: message.id,
    threadId: message.threadId,
    fromName: from.name,
    fromEmail: from.email,
    subject: header("Subject").trim() || "(제목 없음)",
    receivedAt: new Date(Number(message.internalDate)),
    attachmentNames,
    text: plain.length > 0 ? plain.join("\n").trim() : htmlToText(html.join("\n")),
  };
}

export async function getMessage(accessToken: string, id: string) {
  return parseMessage(
    await gmailFetch<GmailMessage>(accessToken, `/messages/${id}?format=full`),
  );
}

/** 이름으로 라벨 ID 를 찾고, 없는 라벨은 만듭니다. 상위 라벨을 먼저 넘겨야 합니다 */
export async function ensureLabels(accessToken: string, names: string[]) {
  const { labels = [] } = await gmailFetch<{
    labels?: { id: string; name: string }[];
  }>(accessToken, "/labels");
  const ids = new Map(labels.map((label) => [label.name, label.id]));

  for (const name of names) {
    if (ids.has(name)) continue;
    const created = await gmailFetch<{ id: string }>(accessToken, "/labels", {
      method: "POST",
      body: {
        name,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });
    ids.set(name, created.id);
  }
  return ids;
}

export async function modifyLabels(
  accessToken: string,
  id: string,
  addLabelIds: string[],
  removeLabelIds: string[],
) {
  await gmailFetch(accessToken, `/messages/${id}/modify`, {
    method: "POST",
    body: { addLabelIds, removeLabelIds },
  });
}
