import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
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
 * 관리자 전용 자료 서빙 (강의 정리 사진).
 *
 * 공개 이미지(/api/media)와 달리 세션이 있어야 열립니다. 문의 첨부와 같이
 * 세션이 없으면 404를 돌려 파일 존재 여부 자체를 노출하지 않고, `adm`
 * 네임스페이스만 허용해 이 주소로 다른 파일을 꺼내갈 수 없게 합니다.
 * 브라우저·중간 캐시에 남지 않도록 no-store 로 내보냅니다.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/media/[...key]">,
) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 404 });

  const { key: segments } = await context.params;
  const key = segments.join("/");

  if (!hasPrefix(key, STORAGE_PREFIX.adminMedia)) {
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
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
