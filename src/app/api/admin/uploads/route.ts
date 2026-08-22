import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import {
  IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  STORAGE_PREFIX,
  buildStorageKey,
  extensionOf,
  safeFilename,
  validateUpload,
} from "@/lib/upload";

export const runtime = "nodejs";

const MESSAGES: Record<string, string> = {
  EMPTY: "빈 파일은 업로드할 수 없습니다.",
  TOO_LARGE: "이미지 크기는 4MB 이하여야 합니다.",
  EXTENSION: "png · jpg · webp 만 업로드할 수 있습니다.",
  MIME: "파일 형식이 확장자와 맞지 않습니다.",
  CONTENT: "파일 내용이 확장자와 맞지 않습니다.",
};

/**
 * 콘텐츠 이미지 업로드 — 관리자 전용.
 *
 * 문의 첨부(/api/uploads)와 달리 결과물이 공개 사이트에 노출되므로
 * `pub` 네임스페이스에 저장하고 이미지 포맷만 허용합니다.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 401 });
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
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: MESSAGES.TOO_LARGE }, { status: 413 });
  }

  const filename = safeFilename(file.name);
  const ext = extensionOf(filename);
  if (!IMAGE_EXTENSIONS.includes(ext as "png")) {
    return NextResponse.json({ error: MESSAGES.EXTENSION }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const rejection = validateUpload(filename, file.type, bytes);
  if (rejection) {
    return NextResponse.json({ error: MESSAGES[rejection] }, { status: 400 });
  }

  try {
    const stored = await getStorage().put({
      key: buildStorageKey(STORAGE_PREFIX.media, ext),
      body: bytes,
      mimeType: file.type,
    });

    return NextResponse.json({
      url: `/api/media/${stored.key}`,
      filename,
      size: stored.size,
    });
  } catch (error) {
    console.error("[admin/uploads] 저장 실패", error);
    return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }
}
