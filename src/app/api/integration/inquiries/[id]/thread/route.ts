import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { describeInquiry, verifyDatahealthRequest } from "@/lib/datahealth";
import { boardPathFor } from "@/lib/constants";
import ko from "@/messages/ko.json";

export const runtime = "nodejs";

/**
 * 견적·원가 시스템(datahealth)에서 문의 한 건을 열 때 — 문의 내용과 답글 스레드.
 *
 * 고객이 게시판에서 보는 것과 같은 범위(문의 내용·공개 답변·답글)만 줍니다.
 * 연락처·이메일·내부 메모는 싣지 않고, 첨부는 파일 이름만 알려줍니다(내려받기는 관리자 화면에서).
 * 로그인 없이 열려 있는 경로라 공유 비밀키 서명이 유일한 관문입니다.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await request.text();
  if (!verifyDatahealthRequest(request, `/api/integration/inquiries/${id}/thread`, raw)) {
    return NextResponse.json({ error: "서명이 올바르지 않습니다." }, { status: 401 });
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      files: { select: { filename: true, size: true }, orderBy: { createdAt: "asc" } },
      repliedBy: { select: { name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          authorType: true,
          authorName: true,
          body: true,
          createdAt: true,
          files: { select: { filename: true, size: true } },
        },
      },
    },
  });
  if (!inquiry) return NextResponse.json({ error: "문의를 찾을 수 없습니다." }, { status: 404 });

  const brief = describeInquiry(inquiry);
  const serviceLabel = ko.service[inquiry.serviceType];

  return NextResponse.json({
    ...brief,
    title: inquiry.title ?? `${serviceLabel} 견적문의`,
    serviceType: serviceLabel,
    board: boardPathFor(inquiry.serviceType),
    status: inquiry.status,
    locale: inquiry.locale,
    hasEmail: Boolean(inquiry.email),
    createdAt: inquiry.createdAt,
    files: inquiry.files,
    // 답글 스레드 도입 전 방식의 공개 답변 — 남아 있으면 스레드 맨 위에 보여줍니다
    answer: inquiry.replyBody
      ? { body: inquiry.replyBody, authorName: inquiry.repliedBy?.name ?? null, createdAt: inquiry.repliedAt }
      : null,
    replies: inquiry.replies,
  });
}
