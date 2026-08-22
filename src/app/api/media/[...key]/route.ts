import { NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { STORAGE_PREFIX, extensionOf, hasPrefix } from "@/lib/upload";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/**
 * 콘텐츠 이미지 공개 서빙.
 *
 * `pub` 네임스페이스만 허용합니다. 이 검사가 없으면 문의 첨부(`inq`)를
 * 인증 없이 꺼내갈 수 있습니다. 파일명이 UUID라 URL은 추측 불가능하고,
 * 내용이 바뀌면 새 키가 발급되므로 immutable 캐시를 겁니다.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/media/[...key]">,
) {
  const { key: segments } = await context.params;
  const key = segments.join("/");

  if (!hasPrefix(key, STORAGE_PREFIX.media)) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = CONTENT_TYPES[extensionOf(key)];
  if (!contentType) return new NextResponse(null, { status: 404 });

  const storage = getStorage();
  if (!storage.read) return new NextResponse(null, { status: 501 });

  const bytes = await storage.read(key);
  if (!bytes) return new NextResponse(null, { status: 404 });

  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
