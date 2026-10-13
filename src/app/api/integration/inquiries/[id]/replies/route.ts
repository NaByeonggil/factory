import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";
import { getStorage } from "@/lib/storage";
import { notifyInquiryReply } from "@/lib/notify";
import { verifyDatahealthRequest } from "@/lib/datahealth";
import { STORAGE_PREFIX, buildStorageKey, safeFilename, validateUpload } from "@/lib/upload";

export const runtime = "nodejs";

const PDF = "application/pdf";

/**
 * 견적·원가 시스템(datahealth)이 보내는 운영자 답글.
 *
 * - 견적서 화면의 「홈페이지 문의에 보내기」: 견적서 PDF 를 첨부한 답글을 달고,
 *   문의를 「견적발송」 단계로 옮깁니다.
 * - 홈페이지 문의 화면의 「답변 달기」: 글만 있는 답글. 처리 단계는 건드리지 않습니다.
 * 로그인 없이 열려 있는 경로라 공유 비밀키 서명이 유일한 관문입니다.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await request.text();
  if (!verifyDatahealthRequest(request, `/api/integration/inquiries/${id}/replies`, raw)) {
    return NextResponse.json({ error: "서명이 올바르지 않습니다." }, { status: 401 });
  }

  let body: {
    message?: unknown;
    notifyCustomer?: unknown;
    authorName?: unknown;
    file?: { filename?: unknown; base64?: unknown };
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    select: { id: true, status: true, name: true, email: true, locale: true },
  });
  if (!inquiry) return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });

  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  const authorName =
    (typeof body.authorName === "string" ? body.authorName.trim().slice(0, 50) : "") || "담당자";

  const storage = getStorage();
  let attached: { storageKey: string; filename: string; size: number; mimeType: string } | null = null;

  if (body.file !== undefined && body.file !== null) {
    if (typeof body.file.base64 !== "string" || typeof body.file.filename !== "string") {
      return NextResponse.json({ error: "견적서 파일이 올바르지 않습니다." }, { status: 400 });
    }
    const bytes = new Uint8Array(Buffer.from(body.file.base64, "base64"));
    const filename = safeFilename(body.file.filename);
    // 고객 첨부와 같은 검사 — 확장자·크기·실제 내용이 PDF 인지 확인합니다
    const rejection = validateUpload(filename, PDF, bytes);
    if (rejection || !filename.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: `견적서 파일을 받을 수 없습니다 (${rejection ?? "EXTENSION"}).` }, { status: 400 });
    }
    const storageKey = buildStorageKey(STORAGE_PREFIX.inquiry, "pdf");
    await storage.put({ key: storageKey, body: bytes, mimeType: PDF });
    attached = { storageKey, filename, size: bytes.byteLength, mimeType: PDF };
  } else if (!message) {
    return NextResponse.json({ error: "답글 내용을 입력해주세요." }, { status: 400 });
  }

  // 견적서를 보낼 때만 단계를 옮깁니다. 이미 계약·종료까지 간 문의의 단계는 되돌리지 않습니다
  const advance = attached !== null && (inquiry.status === "NEW" || inquiry.status === "CONTACTED");

  try {
    await prisma.inquiry.update({
      where: { id },
      data: {
        ...(advance ? { status: "QUOTED" as const } : {}),
        replies: {
          create: {
            authorType: "ADMIN",
            authorName,
            body: message,
            ...(attached ? { files: { create: [attached] } } : {}),
          },
        },
      },
    });
  } catch (error) {
    console.error("[integration/replies] 저장 실패", error);
    // 답글이 저장되지 않았으면 방금 올린 파일은 고아가 되므로 지웁니다
    if (attached) await storage.delete(attached.storageKey).catch(() => undefined);
    return NextResponse.json({ error: "답글 저장 중 오류가 발생했습니다." }, { status: 500 });
  }

  // 저장이 커밋된 뒤에 알림 — 알림 실패가 답글 저장을 되돌리지 않도록
  if (body.notifyCustomer === true && inquiry.email) {
    await notifyInquiryReply({
      id,
      name: inquiry.name,
      email: inquiry.email,
      locale: inquiry.locale.toLowerCase(),
    });
  }

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/quote`);
    revalidatePath(`/${locale}/quote/${id}`);
  }
  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath("/admin/inquiries");

  return NextResponse.json({ ok: true, status: advance ? "QUOTED" : inquiry.status }, { status: 201 });
}
