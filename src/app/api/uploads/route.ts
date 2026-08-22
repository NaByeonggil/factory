import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { getRequestMeta } from "@/lib/request-meta";
import { rateLimit } from "@/lib/rate-limit";
import {
  MAX_UPLOAD_BYTES,
  STORAGE_PREFIX,
  buildStorageKey,
  extensionOf,
  safeFilename,
  signUploadKey,
  validateUpload,
} from "@/lib/upload";

export const runtime = "nodejs";

const MESSAGES: Record<string, string> = {
  EMPTY: "빈 파일은 첨부할 수 없습니다.",
  TOO_LARGE: "파일 크기는 5MB 이하여야 합니다.",
  EXTENSION: "허용되지 않는 확장자입니다.",
  MIME: "파일 형식이 확장자와 맞지 않습니다.",
  CONTENT: "파일 내용이 확장자와 맞지 않습니다.",
};

/**
 * 문의 첨부 업로드 (비로그인 허용).
 *
 * Server Action은 본문이 기본 1MB로 제한되므로 파일은 이 라우트로 받고,
 * 응답의 key + token 을 문의 제출 시 함께 보냅니다. 토큰이 없으면 임의의
 * storage key를 첨부로 위조할 수 있습니다.
 */
export async function POST(request: Request) {
  const meta = await getRequestMeta();
  const limited = rateLimit(`upload:${meta.ipHash ?? "unknown"}`, 20, 10 * 60 * 1000);
  if (!limited.success) {
    return NextResponse.json(
      { error: "업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: MESSAGES.TOO_LARGE }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const filename = safeFilename(file.name);
  const rejection = validateUpload(filename, file.type, bytes);
  if (rejection) {
    return NextResponse.json({ error: MESSAGES[rejection] }, { status: 400 });
  }

  try {
    const stored = await getStorage().put({
      key: buildStorageKey(STORAGE_PREFIX.inquiry, extensionOf(filename)),
      body: bytes,
      mimeType: file.type,
    });

    return NextResponse.json({
      key: stored.key,
      token: signUploadKey(stored.key),
      url: stored.url,
      filename,
      size: stored.size,
      mimeType: stored.mimeType,
    });
  } catch (error) {
    console.error("[uploads] 저장 실패", error);
    return NextResponse.json(
      { error: "업로드에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
