import { NextResponse, after } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createInquiryPost } from "@/lib/inquiry";
import { notifyNewInquiry } from "@/lib/notify";
import { SUPPLEMENT_FORMULATIONS } from "@/lib/constants";
import ko from "@/messages/ko.json";

export const runtime = "nodejs";

const SOURCE = "ai-quote";

const bodySchema = z.object({
  externalId: z.uuid(),
  kind: z.enum(["quote", "inquiry"]),
  name: z.string().trim().min(1).max(50),
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(4).max(50),
  title: z.string().trim().min(1).max(100),
  serviceType: z.literal("OEM"),
  formulation: z.string().trim().max(50).nullable(),
  healthConcern: z.string().trim().max(100),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  message: z.string().max(6000),
  links: z.object({ quote: z.url().optional(), pdf: z.url().optional() }),
});

/** 한글 제형 이름 → 제형 코드 (정제 → TABLET) */
const FORMULATION_BY_LABEL = new Map<string, string>(
  SUPPLEMENT_FORMULATIONS.map((code) => [ko.options.formulation[code], code]),
);

/** 공유 키 확인. 키가 설정되지 않았으면 null — 연동이 꺼진 상태입니다 */
function authorized(request: Request): boolean | null {
  const key = process.env.AI_QUOTE_KEY;
  if (!key || key.length < 32) return null;
  const expected = Buffer.from(`Bearer ${key}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const boardUrl = (id: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/ko/quote/${id}`;

const found = (id: string) => NextResponse.json({ id, url: boardUrl(id) });

const findByExternalId = (externalId: string) =>
  prisma.inquiry.findUnique({ where: { externalId }, select: { id: true } });

/**
 * AI 견적(ai 견적 서버)이 견적서를 내거나 상담을 담당자에게 넘길 때,
 * 문의 내용을 건기식 생산문의 게시판(/ko/quote)에 비밀글로 올립니다.
 *
 * 사람이 쓰는 양식이 아니라 봇 확인·허니팟은 건너뛰고, 공유 키(AI_QUOTE_KEY)가 유일한 관문입니다.
 * 출발지 IP 제한은 nginx 에서 합니다. AI 견적의 대기 한도가 8초라 알림은 응답 뒤에 보냅니다.
 * AI 견적이 이미 견적을 낸 글이라 datahealth 로는 넘기지 않습니다 —
 * 게시판 목록(/api/integration/board)에는 그대로 나타납니다.
 */
export async function POST(request: Request) {
  const auth = authorized(request);
  if (auth === null) return new NextResponse("AI 견적 연동이 설정되지 않았습니다.", { status: 503 });
  if (!auth) return new NextResponse("unauthorized", { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return new NextResponse(`${issue.path.join(".") || "body"}: ${issue.message}`, { status: 400 });
  }
  const b = parsed.data;

  // 같은 견적이 다시 오면 (재시도 등) 새 글을 만들지 않고 기존 글을 돌려줍니다
  const existing = await findByExternalId(b.externalId);
  if (existing) return found(existing.id);

  // 목록에 있는 제형은 코드로 저장하고, 없는 제형(분말 스틱 등)은 본문 맨 위에 남깁니다
  const formulationCode = b.formulation ? FORMULATION_BY_LABEL.get(b.formulation) : undefined;
  const header = b.formulation && !formulationCode ? `제형: ${b.formulation}` : null;

  // 견적서 링크는 본문에 들어 있어야 하지만, 빠졌으면 끝에 붙입니다
  const links = [
    b.links.quote && !b.message.includes(b.links.quote) ? `견적서: ${b.links.quote}` : null,
    b.links.pdf && !b.message.includes(b.links.pdf) ? `견적서 PDF: ${b.links.pdf}` : null,
  ].filter(Boolean);

  const message = [header, b.message.trim(), links.length ? links.join("\n") : null]
    .filter(Boolean)
    .join("\n\n");

  try {
    const inquiry = await createInquiryPost({
      externalId: b.externalId,
      source: SOURCE,
      name: b.name,
      phone: b.phone,
      password: b.password,
      title: b.title,
      serviceType: b.serviceType,
      formulations: formulationCode ? [formulationCode] : [],
      healthConcern: b.healthConcern || null,
      targetDate: new Date(b.targetDate),
      message: message || null,
      // 개인정보 동의는 AI 견적 문의 양식에서 받았습니다 (게시판 등록 목적 포함)
      privacyAgreedAt: new Date(),
      locale: "KO",
    });

    after(() => notifyNewInquiry(inquiry));

    return found(inquiry.id);
  } catch (error) {
    // 같은 externalId 가 동시에 두 번 들어와 한쪽이 먼저 저장한 경우
    if ((error as { code?: string }).code === "P2002") {
      const raced = await findByExternalId(b.externalId);
      if (raced) return found(raced.id);
    }
    console.error("[ai-quote] 게시판 등록 실패", error);
    return new NextResponse("게시판 등록에 실패했습니다.", { status: 500 });
  }
}
