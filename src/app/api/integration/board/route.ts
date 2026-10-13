import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDatahealthRequest } from "@/lib/datahealth";
import { FOOD_SERVICE_TYPES } from "@/lib/constants";
import ko from "@/messages/ko.json";
import type { InquiryStatus, ServiceType } from "@/generated/prisma/enums";

export const runtime = "nodejs";

const PATH = "/api/integration/board";
const PAGE_SIZE = 20;

/** 견적·원가 시스템에 보여주는 게시판 — 건기식(식품) 생산문의와 펫제품 생산문의 */
const BOARDS: Record<string, readonly ServiceType[]> = {
  food: FOOD_SERVICE_TYPES,
  pet: ["PET"],
};

/**
 * 견적·원가 시스템(datahealth)의 「홈페이지 문의」 화면이 읽어가는 게시판 목록.
 *
 * 담당자용이라 작성자 이름을 가리지 않고, 모든 언어의 문의를 함께 줍니다.
 * 연락처·이메일은 싣지 않습니다. 로그인 없이 열려 있는 경로라 공유 비밀키 서명이 유일한 관문입니다.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyDatahealthRequest(request, PATH, raw)) {
    return NextResponse.json({ error: "서명이 올바르지 않습니다." }, { status: 401 });
  }

  let body: { board?: unknown; page?: unknown; waitingOnly?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const types = typeof body.board === "string" ? BOARDS[body.board] : undefined;
  if (!types) return NextResponse.json({ error: "없는 게시판입니다." }, { status: 400 });

  const page = Math.max(Math.floor(Number(body.page)) || 1, 1);
  const skip = (page - 1) * PAGE_SIZE;

  const board = {
    // 스팸으로 분류한 문의는 게시판에서 제외합니다
    status: { not: "SPAM" as InquiryStatus },
    serviceType: { in: [...types] },
  };
  /** 운영자 답변이 한 번도 없는 문의 */
  const waiting = { ...board, repliedAt: null, replies: { none: { authorType: "ADMIN" as const } } };
  const where = body.waitingOnly === true ? waiting : board;

  const [rows, total, waitingCount] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        serviceType: true,
        name: true,
        company: true,
        status: true,
        repliedAt: true,
        createdAt: true,
        replies: {
          orderBy: { createdAt: "desc" },
          select: { authorType: true },
        },
      },
    }),
    prisma.inquiry.count({ where }),
    prisma.inquiry.count({ where: waiting }),
  ]);

  return NextResponse.json({
    items: rows.map((row, index) => {
      const answered = row.repliedAt !== null || row.replies.some((r) => r.authorType === "ADMIN");
      return {
        id: row.id,
        // 최신 글이 가장 큰 번호를 갖도록 전체 건수에서 역산합니다
        no: total - skip - index,
        title: row.title ?? `${ko.service[row.serviceType]} 견적문의`,
        serviceType: ko.service[row.serviceType],
        name: row.name,
        company: row.company,
        status: row.status,
        answered,
        // 답변 뒤에 고객이 다시 글을 남긴 문의 — 담당자가 다시 봐야 합니다
        customerWaiting: answered && row.replies[0]?.authorType === "CUSTOMER",
        replyCount: row.replies.length,
        createdAt: row.createdAt,
      };
    }),
    total,
    waitingCount,
    page,
    pageCount: Math.max(Math.ceil(total / PAGE_SIZE), 1),
  });
}
