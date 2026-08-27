import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import {
  STORAGE_PREFIX,
  contentDisposition,
  hasPrefix,
  verifyDownloadToken,
} from "@/lib/upload";

export const runtime = "nodejs";

/**
 * 견적문의 게시판 첨부 다운로드 — 고객용.
 *
 * 세션 대신 서명 토큰으로 권한을 확인합니다. 토큰은 비밀번호 확인을 통과한
 * 응답에서만 발급되고 30분 뒤 만료됩니다. 서명이 없거나 만료됐으면 404를
 * 돌려 파일 존재 여부 자체를 노출하지 않습니다.
 */
export async function GET(
  request: Request,
  context: RouteContext<"/api/quote-files/[...key]">,
) {
  const { key: segments } = await context.params;
  const key = segments.join("/");
  if (!hasPrefix(key, STORAGE_PREFIX.inquiry)) {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(request.url);
  const expiresAt = Number(url.searchParams.get("exp"));
  const token = url.searchParams.get("sig") ?? "";
  if (!verifyDownloadToken(key, expiresAt, token)) {
    return new NextResponse(null, { status: 404 });
  }

  // DB에 등록된 첨부만 내보냅니다 (고아 파일 열람 차단)
  const record =
    (await prisma.inquiryReplyFile.findFirst({
      where: { storageKey: key },
      select: { filename: true, mimeType: true },
    })) ??
    (await prisma.inquiryFile.findFirst({
      where: { storageKey: key },
      select: { filename: true, mimeType: true },
    }));
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
      // PDF·이미지는 클릭 즉시 보이도록 inline, 나머지는 내려받기
      "Content-Disposition": contentDisposition(record.filename, record.mimeType),
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
