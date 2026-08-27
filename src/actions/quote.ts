"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getRequestMeta } from "@/lib/request-meta";
import { rateLimit } from "@/lib/rate-limit";
import { notifyCustomerReply, notifyInquiryReply } from "@/lib/notify";
import { getStorage } from "@/lib/storage";
import {
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_FILES,
  verifyUploadKey,
} from "@/lib/upload";
import { routing } from "@/i18n/routing";
import { checkbox, text, type ActionState } from "@/lib/validations/admin";
import {
  REPLY_SELECT,
  getQuoteDetailUnlocked,
  toQuoteReply,
  type QuoteDetail,
  type QuoteReply,
} from "@/lib/queries";

export type QuoteRevealResult =
  | { ok: true; detail: QuoteDetail }
  | { ok: false; error: "WRONG_PASSWORD" | "RATE_LIMIT" | "NOT_FOUND" | "NO_PASSWORD" };

const revealSchema = z.object({
  id: z.string().min(1).max(40),
  password: z.string().min(1).max(50),
});

/**
 * 견적문의 본문·답변 열람.
 * 비밀번호가 맞을 때만 내용을 돌려주고, 무차별 대입은 레이트리밋으로 막습니다.
 */
export async function revealQuote(
  id: string,
  password: string,
): Promise<QuoteRevealResult> {
  const parsed = revealSchema.safeParse({ id, password });
  if (!parsed.success) return { ok: false, error: "WRONG_PASSWORD" };

  const meta = await getRequestMeta();
  const limited = rateLimit(
    `quote-reveal:${meta.ipHash ?? "unknown"}:${id}`,
    10,
    10 * 60 * 1000,
  );
  if (!limited.success) return { ok: false, error: "RATE_LIMIT" };

  const row = await prisma.inquiry.findFirst({
    where: { id: parsed.data.id, status: { not: "SPAM" } },
    select: { passwordHash: true },
  });
  if (!row) return { ok: false, error: "NOT_FOUND" };
  // 게시판 도입 전 접수분 — 비밀번호가 없어 열람 경로가 없습니다
  if (!row.passwordHash) return { ok: false, error: "NO_PASSWORD" };

  const matched = await bcrypt.compare(parsed.data.password, row.passwordHash);
  if (!matched) return { ok: false, error: "WRONG_PASSWORD" };

  const detail = await getQuoteDetailUnlocked(parsed.data.id);
  if (!detail) return { ok: false, error: "NOT_FOUND" };

  return { ok: true, detail };
}

// ─────────────────────── 답글 (고객) ───────────────────────

/** 업로드 라우트가 발급한 key + 서명 토큰 */
const attachmentSchema = z.object({
  key: z.string().min(1).max(200),
  token: z.string().length(64),
  filename: z.string().min(1).max(200),
  size: z.number().int().min(1).max(MAX_UPLOAD_BYTES),
  mimeType: z.string().min(1).max(200),
});

export type ReplyAttachment = z.infer<typeof attachmentSchema>;

export type AddReplyResult =
  | { ok: true; replies: QuoteReply[] }
  | {
      ok: false;
      error: "WRONG_PASSWORD" | "RATE_LIMIT" | "NOT_FOUND" | "VALIDATION" | "SERVER";
    };

const customerReplySchema = z
  .object({
    id: z.string().min(1).max(40),
    password: z.string().min(1).max(50),
    body: z.string().trim().max(2000),
    attachments: z.array(attachmentSchema).max(MAX_UPLOAD_FILES).default([]),
  })
  // 견적서 파일만 올리는 경우도 있어 둘 중 하나만 있으면 됩니다
  .refine((v) => v.body.length > 0 || v.attachments.length > 0);

/** 서명 토큰이 없는 첨부는 남의 storage key 위조일 수 있어 버립니다 */
function verifiedFiles(attachments: ReplyAttachment[]) {
  const files = attachments.filter((file) =>
    verifyUploadKey(file.key, file.token),
  );
  return files.length === attachments.length ? files : null;
}

async function listReplies(inquiryId: string) {
  const rows = await prisma.inquiryReply.findMany({
    where: { inquiryId },
    orderBy: { createdAt: "asc" },
    select: REPLY_SELECT,
  });
  return rows.map(toQuoteReply);
}

/**
 * 고객이 자기 문의에 다는 답글.
 * 로그인 개념이 없으므로 답글마다 비밀번호로 본인 확인을 다시 합니다.
 */
export async function addQuoteReply(
  id: string,
  password: string,
  body: string,
  attachments: ReplyAttachment[] = [],
): Promise<AddReplyResult> {
  const parsed = customerReplySchema.safeParse({
    id,
    password,
    body,
    attachments,
  });
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const meta = await getRequestMeta();
  const limited = rateLimit(
    `quote-reply:${meta.ipHash ?? "unknown"}:${id}`,
    10,
    10 * 60 * 1000,
  );
  if (!limited.success) return { ok: false, error: "RATE_LIMIT" };

  const inquiry = await prisma.inquiry.findFirst({
    where: { id: parsed.data.id, status: { not: "SPAM" } },
    select: { id: true, name: true, passwordHash: true },
  });
  if (!inquiry?.passwordHash) return { ok: false, error: "NOT_FOUND" };

  const matched = await bcrypt.compare(parsed.data.password, inquiry.passwordHash);
  if (!matched) return { ok: false, error: "WRONG_PASSWORD" };

  const files = verifiedFiles(parsed.data.attachments);
  if (!files) return { ok: false, error: "VALIDATION" };

  try {
    await prisma.inquiryReply.create({
      data: {
        inquiryId: inquiry.id,
        authorType: "CUSTOMER",
        authorName: inquiry.name,
        body: parsed.data.body,
        ipHash: meta.ipHash,
        files: { create: files.map(toFileRow) },
      },
    });
  } catch (error) {
    console.error("[addQuoteReply] 저장 실패", error);
    return { ok: false, error: "SERVER" };
  }

  // 답글이 달렸음을 담당자에게 알립니다 (저장 커밋 이후)
  await notifyCustomerReply({
    id: inquiry.id,
    name: inquiry.name,
    body: parsed.data.body,
  });

  revalidatePath(`/admin/inquiries/${inquiry.id}`);
  return { ok: true, replies: await listReplies(inquiry.id) };
}

/**
 * 관리자가 공개 게시판 화면에서 바로 다는 답글.
 * 세션이 곧 권한이므로 고객 비밀번호를 묻지 않습니다.
 */
export async function addQuoteReplyAsStaff(
  id: string,
  body: string,
  attachments: ReplyAttachment[] = [],
): Promise<AddReplyResult> {
  const session = await requireSession(["ADMIN", "EDITOR", "SALES"]);

  const parsed = z
    .object({
      id: z.string().min(1).max(40),
      body: z.string().trim().max(2000),
      attachments: z.array(attachmentSchema).max(MAX_UPLOAD_FILES).default([]),
    })
    .refine((v) => v.body.length > 0 || v.attachments.length > 0)
    .safeParse({ id, body, attachments });
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const files = verifiedFiles(parsed.data.attachments);
  if (!files) return { ok: false, error: "VALIDATION" };

  let inquiry;
  try {
    inquiry = await prisma.inquiry.update({
      where: { id: parsed.data.id },
      data: {
        replies: {
          create: {
            authorType: "ADMIN",
            authorId: session.id,
            authorName: session.name,
            body: parsed.data.body,
            files: { create: files.map(toFileRow) },
          },
        },
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("[addQuoteReplyAsStaff] 저장 실패", error);
    return { ok: false, error: "SERVER" };
  }

  revalidatePath(`/admin/inquiries/${inquiry.id}`);
  return { ok: true, replies: await listReplies(inquiry.id) };
}

// ─────────────────────── 관리자 ───────────────────────

const replySchema = z.object({
  replyBody: z
    .string()
    .trim()
    .max(5000, "답변은 5000자까지 입력할 수 있습니다.")
    .transform((v) => (v ? v : null)),
  notifyCustomer: z.boolean(),
});

/** 고객에게 공개되는 답변 저장 (내부 상담 메모와 별개) */
export async function replyToInquiry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // id는 .bind()가 아니라 폼의 hidden 필드로 받습니다 (다른 관리자 폼과 동일)
  const id = String(formData.get("id") ?? "");
  const session = await requireSession(["ADMIN", "EDITOR", "SALES"]);
  if (!id) return { error: "잘못된 요청입니다." };

  const parsed = replySchema.safeParse({
    replyBody: text(formData, "replyBody"),
    notifyCustomer: checkbox(formData, "notifyCustomer"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  }

  const { replyBody, notifyCustomer } = parsed.data;

  let updated;
  try {
    updated = await prisma.inquiry.update({
      where: { id },
      data: {
        replyBody,
        // 답변을 지우면 '답변 대기'로 되돌립니다
        repliedAt: replyBody ? new Date() : null,
        repliedById: replyBody ? session.id : null,
      },
      select: { name: true, email: true, locale: true },
    });
  } catch (error) {
    console.error("[replyToInquiry]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  // 저장이 커밋된 뒤에 알림 — 알림 실패가 답변 저장을 되돌리지 않도록
  if (replyBody && notifyCustomer && updated.email) {
    await notifyInquiryReply({
      id,
      name: updated.name,
      email: updated.email,
      locale: updated.locale.toLowerCase(),
    });
  }

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/quote`);
    revalidatePath(`/${locale}/quote/${id}`);
  }
  revalidatePath(`/admin/inquiries/${id}`);
  redirect(`/admin/inquiries/${id}?replied=1`);
}

/** 운영자가 다는 답글 — 고객 화면 스레드에 바로 노출됩니다 */
export async function addAdminReply(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // id는 .bind()가 아니라 폼의 hidden 필드로 받습니다 (다른 관리자 폼과 동일)
  const id = String(formData.get("id") ?? "");
  const session = await requireSession(["ADMIN", "EDITOR", "SALES"]);

  const body = text(formData, "body").trim();
  if (body.length > 2000) return { error: "답글은 2000자까지 입력할 수 있습니다." };

  // 첨부는 hidden 필드에 JSON으로 실려옵니다 (업로드는 /api/uploads 가 처리)
  const attachments = z
    .array(attachmentSchema)
    .max(MAX_UPLOAD_FILES)
    .safeParse(JSON.parse(text(formData, "attachments") || "[]"));
  if (!attachments.success) return { error: "첨부파일 정보를 확인해주세요." };

  const files = verifiedFiles(attachments.data);
  if (!files) return { error: "첨부파일 검증에 실패했습니다." };

  if (!id || (!body && files.length === 0)) {
    return { error: "답글 내용이나 첨부파일을 입력해주세요." };
  }

  const notifyCustomer = checkbox(formData, "notifyCustomer");

  let inquiry;
  try {
    inquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        replies: {
          create: {
            authorType: "ADMIN",
            authorId: session.id,
            authorName: session.name,
            body,
            files: { create: files.map(toFileRow) },
          },
        },
      },
      select: { name: true, email: true, locale: true },
    });
  } catch (error) {
    console.error("[addAdminReply]", error);
    return { error: "저장 중 오류가 발생했습니다." };
  }

  if (notifyCustomer && inquiry.email) {
    await notifyInquiryReply({
      id,
      name: inquiry.name,
      email: inquiry.email,
      locale: inquiry.locale.toLowerCase(),
    });
  }

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/quote/${id}`);
  }
  revalidatePath(`/admin/inquiries/${id}`);
  redirect(`/admin/inquiries/${id}?replied=1`);
}

/** 스팸·오작성 답글 정리 */
export async function deleteQuoteReply(formData: FormData) {
  const replyId = String(formData.get("replyId") ?? "");
  await requireSession(["ADMIN"]);
  const removed = await prisma.inquiryReply.delete({
    where: { id: replyId },
    select: { inquiryId: true, files: { select: { storageKey: true } } },
  });

  // DB 행은 cascade로 지워지므로 저장소 파일도 함께 정리합니다
  const storage = getStorage();
  await Promise.all(
    removed.files.map((file) =>
      storage.delete(file.storageKey).catch(() => undefined),
    ),
  );

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/quote/${removed.inquiryId}`);
  }
  revalidatePath(`/admin/inquiries/${removed.inquiryId}`);
}

/** 업로드 응답 → InquiryReplyFile 행 */
function toFileRow(file: ReplyAttachment) {
  return {
    storageKey: file.key,
    filename: file.filename,
    size: file.size,
    mimeType: file.mimeType,
  };
}
