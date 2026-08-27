import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const MAX_UPLOAD_FILES = 3;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 파일당 5MB

/** 확장자 → 허용 MIME. 둘 다 맞아야 통과합니다. */
export const ALLOWED_UPLOADS: Record<string, string[]> = {
  pdf: ["application/pdf"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  hwp: ["application/haansofthwp", "application/x-hwp", "application/octet-stream"],
};

export const UPLOAD_ACCEPT = Object.keys(ALLOWED_UPLOADS)
  .map((ext) => `.${ext}`)
  .join(",");

/**
 * 선언된 MIME은 클라이언트가 마음대로 보낼 수 있으므로 앞부분 바이트로 실제
 * 포맷을 확인합니다. (docx/xlsx는 zip, hwp는 OLE 복합문서)
 */
const MAGIC: { ext: string[]; bytes: number[] }[] = [
  { ext: ["pdf"], bytes: [0x25, 0x50, 0x44, 0x46] },
  { ext: ["png"], bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: ["jpg", "jpeg"], bytes: [0xff, 0xd8, 0xff] },
  { ext: ["webp"], bytes: [0x52, 0x49, 0x46, 0x46] },
  { ext: ["docx", "xlsx"], bytes: [0x50, 0x4b, 0x03, 0x04] },
  { ext: ["hwp"], bytes: [0xd0, 0xcf, 0x11, 0xe0] },
];

export function extensionOf(filename: string) {
  const match = /\.([a-zA-Z0-9]+)$/.exec(filename);
  return match ? match[1].toLowerCase() : "";
}

export type UploadRejection =
  | "TOO_LARGE"
  | "EMPTY"
  | "EXTENSION"
  | "MIME"
  | "CONTENT";

export function validateUpload(
  filename: string,
  mimeType: string,
  bytes: Uint8Array,
): UploadRejection | null {
  if (bytes.byteLength === 0) return "EMPTY";
  if (bytes.byteLength > MAX_UPLOAD_BYTES) return "TOO_LARGE";

  const ext = extensionOf(filename);
  const allowedMimes = ALLOWED_UPLOADS[ext];
  if (!allowedMimes) return "EXTENSION";
  if (!allowedMimes.includes(mimeType)) return "MIME";

  const rule = MAGIC.find((m) => m.ext.includes(ext));
  if (rule) {
    const head = bytes.subarray(0, rule.bytes.length);
    if (rule.bytes.some((b, i) => head[i] !== b)) return "CONTENT";
    // WEBP는 RIFF 뒤 8바이트 위치에 'WEBP' 태그가 있어야 합니다
    if (ext === "webp") {
      const tag = new TextDecoder().decode(bytes.subarray(8, 12));
      if (tag !== "WEBP") return "CONTENT";
    }
  }

  return null;
}

/**
 * 저장 네임스페이스.
 *
 * - `inq` 문의 첨부 — 관리자 인증이 걸린 /api/files 로만 열람
 * - `pub` 콘텐츠 이미지 — 누구나 볼 수 있는 /api/media 로 서빙
 *
 * 두 라우트가 각각 자기 접두사만 허용하므로, /api/media 로 문의 첨부를
 * 꺼내가는 경로가 막힙니다.
 */
export const STORAGE_PREFIX = { inquiry: "inq", media: "pub" } as const;
export type StoragePrefix = (typeof STORAGE_PREFIX)[keyof typeof STORAGE_PREFIX];

/** 저장 키. 원본 파일명은 경로에 쓰지 않습니다. */
export function buildStorageKey(prefix: StoragePrefix, ext: string) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${prefix}/${yyyy}/${mm}/${randomUUID()}.${ext}`;
}

export function hasPrefix(key: string, prefix: StoragePrefix) {
  return key.startsWith(`${prefix}/`);
}

/** 콘텐츠 이미지 전용 (문서 포맷 제외) */
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;
export const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map((e) => `.${e}`).join(",");
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** URL(/api/media/<key>)에서 스토리지 키를 되돌립니다 */
export function mediaKeyFromUrl(url: string | null | undefined) {
  if (!url) return null;
  const match = /^\/api\/media\/(.+)$/.exec(url);
  return match ? match[1] : null;
}

/**
 * 업로드 응답에 서명 토큰을 함께 돌려주고, 문의 제출 시 검증합니다.
 * 토큰이 없으면 임의의 storage key를 첨부로 위조할 수 있습니다.
 */
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET 환경변수가 필요합니다.");
  return value;
}

export function signUploadKey(key: string) {
  return createHmac("sha256", secret()).update(key).digest("hex");
}

export function verifyUploadKey(key: string, token: string) {
  if (!token) return false;
  const expected = Buffer.from(signUploadKey(key), "utf8");
  const given = Buffer.from(token, "utf8");
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

/** 디렉터리 성분과 제어문자를 제거해 파일명만 남깁니다 */
export function safeFilename(filename: string) {
  const base = filename.split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return cleaned.slice(0, 150) || "file";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 고객용 첨부 다운로드 토큰.
 *
 * 견적문의 게시판에는 세션이 없고 비밀번호로만 본인을 확인하므로,
 * 비밀번호를 통과한 순간 서버가 "이 키를 이 시각까지 내려받아도 된다"는
 * 서명을 발급합니다. 주소가 유출돼도 만료되면 쓸 수 없습니다.
 */
export const DOWNLOAD_TOKEN_TTL_MS = 30 * 60 * 1000;

export function signDownloadToken(key: string, expiresAt: number) {
  return createHmac("sha256", secret())
    .update(`${key}|${expiresAt}`)
    .digest("hex");
}

export function verifyDownloadToken(
  key: string,
  expiresAt: number,
  token: string,
) {
  if (!token || !Number.isFinite(expiresAt)) return false;
  if (expiresAt < Date.now()) return false;
  const expected = Buffer.from(signDownloadToken(key, expiresAt), "utf8");
  const given = Buffer.from(token, "utf8");
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

/** 만료 시각과 서명을 붙인 고객용 다운로드 주소 */
export function buildDownloadUrl(key: string) {
  const expiresAt = Date.now() + DOWNLOAD_TOKEN_TTL_MS;
  const token = signDownloadToken(key, expiresAt);
  return `/api/quote-files/${key}?exp=${expiresAt}&sig=${token}`;
}

/**
 * 브라우저에서 바로 열어도 되는 타입.
 *
 * PDF·이미지는 스크립트를 실행할 수 없어 inline 으로 내보내고, 그 외
 * 문서 포맷(docx·xlsx·hwp)은 어차피 브라우저가 못 여니 내려받게 둡니다.
 * (HTML·SVG는 애초에 업로드 허용 목록에 없습니다)
 */
export function isInlineViewable(mimeType: string) {
  return (
    mimeType === "application/pdf" ||
    ["image/png", "image/jpeg", "image/webp"].includes(mimeType)
  );
}

/** 다운로드 응답 헤더 — 볼 수 있는 타입은 inline, 나머지는 attachment */
export function contentDisposition(filename: string, mimeType: string) {
  const kind = isInlineViewable(mimeType) ? "inline" : "attachment";
  return `${kind}; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
