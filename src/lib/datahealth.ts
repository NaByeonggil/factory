/**
 * 견적·원가 시스템(datahealth, data.cancerwith.kr)과의 연동.
 *
 * 두 앱은 같은 서버의 같은 도커 네트워크에 있고, 서로를 부를 때 로그인 대신
 * 공유 비밀키(INTEGRATION_SECRET)로 만든 서명을 확인합니다.
 * 같은 규칙이 datahealth 의 src/lib/integration/factory.ts 에 있습니다 —
 * 한쪽을 고치면 다른 쪽도 고쳐야 합니다.
 *
 * 연동은 부가 기능입니다. 설정이 없거나 상대가 꺼져 있어도 문의 접수와
 * 관리자 화면은 그대로 동작해야 하므로, 여기 함수들은 예외를 던지지 않습니다.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import ko from "@/messages/ko.json";
import type { SessionUser } from "@/lib/session";

const TIMEOUT_MS = 4000;
const SSO_TOKEN_TTL_MS = 60 * 1000;
/** 요청 시각 허용 오차 — 가로챈 요청을 나중에 다시 보내는 것을 막습니다 */
const MAX_SKEW_MS = 5 * 60 * 1000;

function config() {
  const secret = process.env.INTEGRATION_SECRET;
  const internalUrl = process.env.DATAHEALTH_INTERNAL_URL;
  if (!secret || secret.length < 32 || !internalUrl) return null;
  return {
    secret,
    internalUrl: internalUrl.replace(/\/+$/, ""),
    publicUrl: (process.env.DATAHEALTH_PUBLIC_URL || "https://data.cancerwith.kr").replace(/\/+$/, ""),
  };
}

export const datahealthConfigured = () => config() !== null;

const hmac = (secret: string, payload: string) =>
  createHmac("sha256", secret).update(payload).digest("hex");

/** 서명 대상: `<시각>.<METHOD>.<경로>.<본문>` */
async function call(method: "GET" | "POST", path: string, body = ""): Promise<Response | null> {
  const cfg = config();
  if (!cfg) return null;
  const timestamp = String(Date.now());
  try {
    return await fetch(`${cfg.internalUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-integration-timestamp": timestamp,
        "x-integration-signature": hmac(cfg.secret, `${timestamp}.${method}.${path}.${body}`),
      },
      body: method === "POST" ? body : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return null;
  }
}

/**
 * 상대편이 보낸 요청의 서명 확인 (이쪽이 받는 연동 API 용).
 * 로그인 없이 열려 있는 /api 경로라 이 확인이 유일한 관문입니다.
 */
export function verifyDatahealthRequest(request: Request, path: string, body: string): boolean {
  const cfg = config();
  if (!cfg) return false;
  const timestamp = request.headers.get("x-integration-timestamp") ?? "";
  const signature = request.headers.get("x-integration-signature") ?? "";
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > MAX_SKEW_MS) return false;
  const expected = Buffer.from(hmac(cfg.secret, `${timestamp}.${request.method}.${path}.${body}`));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// ── 문의 전달 ───────────────────────────────────────────────

type Options = Record<string, string>;
const label = (table: Options, code: string | null) => (code ? (table[code] ?? code) : null);
const labels = (table: Options, codes: string[]) => codes.map((c) => table[c] ?? c);

/**
 * 문의 한 건을 넘겨 AI 분석(분류·정보 추출·답변 초안)을 요청합니다.
 * 같은 문의를 다시 보내도 상대편에서 한 건으로 유지됩니다.
 * 연락처·이메일은 보내지 않습니다 — 분석에 필요 없고 고객 응대는 이쪽에서 합니다.
 */
export async function pushInquiryToDatahealth(inquiryId: string): Promise<boolean> {
  if (!config()) return false;
  try {
    const i = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
    if (!i || i.status === "SPAM") return false;

    const o = ko.options;
    const body = JSON.stringify({
      id: i.id,
      name: i.name,
      company: i.company,
      title: i.title,
      serviceType: i.serviceType,
      formulations: labels(o.formulation, i.formulations),
      packagings: labels(o.packaging, i.packagings),
      quantity: label(o.quantity, i.quantity),
      budget: label(o.budget, i.budget),
      targetDate: i.targetDate ? i.targetDate.toISOString().slice(0, 10) : null,
      targetAudience: i.targetAudience,
      healthConcern: i.healthConcern,
      materialType: label(o.materialType, i.materialType),
      ownedAssets: labels(o.ownedAsset, i.ownedAssets),
      targetPrice: i.targetPrice,
      message: i.message,
    });

    const res = await call("POST", "/api/integration/inquiries", body);
    if (!res?.ok) {
      console.error("[datahealth] 문의 전달 실패", inquiryId, res?.status ?? "연결 불가");
      return false;
    }
    return true;
  } catch (error) {
    console.error("[datahealth] 문의 전달 실패", inquiryId, error);
    return false;
  }
}

/**
 * 견적서를 쓰기로 한 문의의 고객 정보를 넘겨 고객사로 등록합니다.
 * 접수 때는 연락처를 보내지 않고, 담당자가 「견적서 만들기」를 누른 시점에만 보냅니다.
 */
export async function pushCustomerToDatahealth(inquiryId: string): Promise<boolean> {
  if (!config()) return false;
  try {
    const i = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: { name: true, company: true, phone: true, email: true },
    });
    if (!i) return false;
    const res = await call("POST", `/api/integration/inquiries/${inquiryId}/customer`, JSON.stringify(i));
    return res?.ok ?? false;
  } catch (error) {
    console.error("[datahealth] 고객 정보 전달 실패", inquiryId, error);
    return false;
  }
}

/**
 * 문의 처리 단계와 답변 여부를 알려 상대편 문의 게시판을 맞춥니다.
 * 실패해도 이쪽 동작에는 영향이 없습니다.
 */
export async function pushInquiryStatusToDatahealth(inquiryId: string): Promise<void> {
  if (!config()) return;
  try {
    const i = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: { status: true, repliedAt: true, _count: { select: { replies: { where: { authorType: "ADMIN" } } } } },
    });
    if (!i) return;
    await call(
      "POST",
      `/api/integration/inquiries/${inquiryId}/status`,
      JSON.stringify({ status: i.status, replied: Boolean(i.repliedAt) || i._count.replies > 0 }),
    );
  } catch (error) {
    console.error("[datahealth] 상태 전달 실패", inquiryId, error);
  }
}

// ── AI 분석 조회 ────────────────────────────────────────────

export type InquiryAnalysis = {
  status: string;
  inquiryType: string | null;
  priority: string;
  confidence: number | null;
  extracted: {
    materials?: { name: string; quantity?: string }[];
    productType?: string;
    productionQty?: number;
    missingInfo?: string[];
    additionalNotes?: string;
  } | null;
  draft: string | null;
  error: string | null;
  processedAt: string | null;
};

export type AnalysisResult =
  | { state: "disabled" } // 연동 설정 없음
  | { state: "unreachable" } // 상대 앱에 닿지 않음
  | { state: "missing" } // 아직 넘어가지 않은 문의
  | { state: "ok"; analysis: InquiryAnalysis };

export async function getInquiryAnalysis(inquiryId: string): Promise<AnalysisResult> {
  if (!config()) return { state: "disabled" };
  const res = await call("GET", `/api/integration/inquiries/${inquiryId}`);
  if (!res) return { state: "unreachable" };
  if (res.status === 404) return { state: "missing" };
  if (!res.ok) return { state: "unreachable" };
  try {
    return { state: "ok", analysis: (await res.json()) as InquiryAnalysis };
  } catch {
    return { state: "unreachable" };
  }
}

// ── 자동 로그인 ─────────────────────────────────────────────

/**
 * 견적·원가 시스템으로 넘어가는 1회용 로그인 주소(유효 60초).
 * 어느 계정으로 들어갈지는 상대편 설정(SSO_USER_MAP)이 정합니다.
 */
export function datahealthSsoUrl(session: SessionUser, next = "/"): string | null {
  const cfg = config();
  if (!cfg) return null;
  const claims = {
    email: session.email,
    name: session.name,
    role: session.role,
    exp: Date.now() + SSO_TOKEN_TTL_MS,
    nonce: randomBytes(16).toString("hex"),
  };
  const encoded = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const token = `${encoded}.${hmac(cfg.secret, `sso.${encoded}`)}`;
  return `${cfg.publicUrl}/api/auth/sso?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
}

/** 로그인 없이 여는 주소 — 연동이 꺼져 있을 때의 대비 */
export const datahealthPublicUrl = () =>
  (process.env.DATAHEALTH_PUBLIC_URL || "https://data.cancerwith.kr").replace(/\/+$/, "");
