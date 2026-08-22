import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * 첨부파일 다운로드 — 관리자 전용.
 *
 * 문의 첨부는 고객사 기획서·스펙시트가 들어오는 자리라 public/ 에 두지 않고
 * 이 라우트를 통해서만 내보냅니다. 세션이 없으면 404를 돌려 파일 존재 여부
 * 자체를 노출하지 않습니다.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/files/[...key]">,
) {
  const session = await getSession();
  if (!session) return new NextResponse(null, { status: 404 });

  const { key: segments } = await context.params;
  const key = segments.join("/");

  // DB에 등록된 첨부만 내보냅니다 (고아 파일 열람 차단)
  const record = await prisma.inquiryFile.findFirst({
    where: { storageKey: key },
    select: { filename: true, mimeType: true },
  });
  if (!record) return new NextResponse(null, { status: 404 });

  const storage = getStorage();
  if (!storage.read) {
    return NextResponse.json(
      { error: "현재 스토리지 드라이버는 직접 읽기를 지원하지 않습니다." },
      { status: 501 },
    );
  }

  const bytes = await storage.read(key);
  if (!bytes) return new NextResponse(null, { status: 404 });

  return new NextResponse(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": record.mimeType || "application/octet-stream",
      // 브라우저에서 렌더링하지 않고 항상 내려받게 합니다 (XSS 방지)
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(record.filename)}`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
