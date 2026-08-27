"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getRequestMeta } from "@/lib/request-meta";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { notifyNewQuestion } from "@/lib/notify";
import { routing, toDbLocale } from "@/i18n/routing";
import {
  answerSchema,
  questionSchema,
  revealSchema,
  type QuestionInput,
} from "@/lib/validations/qna";
import { checkbox, text, type ActionState } from "@/lib/validations/admin";
import type { Locale } from "@/generated/prisma/enums";

function revalidateQna(id?: string) {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/community/qna`);
    if (id) revalidatePath(`/${locale}/community/qna/${id}`);
  }
}

// ─────────────────────── 공개 (고객) ───────────────────────

export type QuestionActionResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: "VALIDATION" | "RATE_LIMIT" | "BOT" | "SERVER";
      fieldErrors?: Record<string, string>;
    };

export async function submitQuestion(
  locale: string,
  input: QuestionInput,
): Promise<QuestionActionResult> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { ok: false, error: "VALIDATION", fieldErrors };
  }

  const data = parsed.data;

  // 허니팟: 사람이라면 절대 채우지 않는 필드
  if (data.website) return { ok: false, error: "BOT" };

  const meta = await getRequestMeta();

  const limited = rateLimit(`qna:${meta.ipHash ?? "unknown"}`, 5, 10 * 60 * 1000);
  if (!limited.success) return { ok: false, error: "RATE_LIMIT" };

  const humanVerified = await verifyTurnstile(
    data.turnstileToken,
    meta.ip ?? undefined,
  );
  if (!humanVerified) return { ok: false, error: "BOT" };

  try {
    const question = await prisma.question.create({
      data: {
        authorName: data.authorName,
        company: data.company || null,
        email: data.email || null,
        phone: data.phone || null,
        passwordHash: await bcrypt.hash(data.password, 12),
        isSecret: data.isSecret,
        title: data.title,
        body: data.body,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
        locale: toDbLocale(locale) as Locale,
      },
      select: { id: true, authorName: true, title: true, body: true, isSecret: true },
    });

    // 저장이 커밋된 뒤에 알림 — 알림 실패가 접수를 되돌리지 않도록
    await notifyNewQuestion(question);

    revalidateQna();
    return { ok: true, id: question.id };
  } catch (error) {
    console.error("[submitQuestion] 저장 실패", error);
    return { ok: false, error: "SERVER" };
  }
}

export type RevealResult =
  | { ok: true; body: string; answerBody: string | null }
  | { ok: false; error: "WRONG_PASSWORD" | "RATE_LIMIT" | "NOT_FOUND" };

/** 비밀글 본문 열람 — 비밀번호가 맞을 때만 내용을 돌려줍니다 */
export async function revealQuestion(
  id: string,
  password: string,
): Promise<RevealResult> {
  const parsed = revealSchema.safeParse({ id, password });
  if (!parsed.success) return { ok: false, error: "WRONG_PASSWORD" };

  const meta = await getRequestMeta();
  // 무차별 대입 방지 — 글 하나당 IP 기준 10회/10분
  const limited = rateLimit(
    `qna-reveal:${meta.ipHash ?? "unknown"}:${id}`,
    10,
    10 * 60 * 1000,
  );
  if (!limited.success) return { ok: false, error: "RATE_LIMIT" };

  const row = await prisma.question.findFirst({
    where: { id: parsed.data.id, isPublished: true },
    select: { passwordHash: true, body: true, answerBody: true },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };

  const matched = await bcrypt.compare(parsed.data.password, row.passwordHash);
  if (!matched) return { ok: false, error: "WRONG_PASSWORD" };

  return { ok: true, body: row.body, answerBody: row.answerBody };
}

// ─────────────────────── 관리자 ───────────────────────

export async function answerQuestion(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // id는 .bind()가 아니라 폼의 hidden 필드로 받습니다 (다른 관리자 폼과 동일)
  const id = String(formData.get("id") ?? "");
  const session = await requireSession(["ADMIN", "EDITOR"]);
  if (!id) return { error: "잘못된 요청입니다." };

  const parsed = answerSchema.safeParse({
    answerBody: text(formData, "answerBody"),
    isPublished: checkbox(formData, "isPublished"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.",
    };
  }

  const { answerBody, isPublished } = parsed.data;

  try {
    await prisma.question.update({
      where: { id },
      data: {
        answerBody,
        // 답변을 지우면 '미답변'으로 되돌립니다
        answeredAt: answerBody ? new Date() : null,
        answeredById: answerBody ? session.id : null,
        isPublished,
      },
    });
  } catch (error) {
    console.error("[answerQuestion]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  revalidateQna(id);
  revalidatePath("/admin/qna");
  redirect(`/admin/qna/${id}?saved=1`);
}

export async function deleteQuestion(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await requireSession(["ADMIN"]);
  await prisma.question.delete({ where: { id } });
  revalidateQna(id);
  revalidatePath("/admin/qna");
  redirect("/admin/qna");
}
