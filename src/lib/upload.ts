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

/** 저장 키. 원본 파일명은 경로에 쓰지 않습니다. */
export function buildStorageKey(ext: string) {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}/${mm}/${randomUUID()}.${ext}`;
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
