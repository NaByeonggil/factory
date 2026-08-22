"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionCookie,
  destroySessionCookie,
  requireSession,
  verifyPassword,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestMeta } from "@/lib/request-meta";
import { INQUIRY_STATUSES } from "@/lib/constants";
import type { InquiryStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  next: z.string().optional(),
});

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) return { error: "이메일과 비밀번호를 확인해주세요." };

  const meta = await getRequestMeta();
  const limited = rateLimit(`login:${meta.ipHash ?? "unknown"}`, 10, 10 * 60 * 1000);
  if (!limited.success) {
    return { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // 계정 존재 여부를 노출하지 않도록 실패 메시지를 통일
  if (!user || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const target = parsed.data.next?.startsWith("/admin") ? parsed.data.next : "/admin";
  redirect(target);
}

export async function logout() {
  await destroySessionCookie();
  redirect("/admin/login");
}

export async function updateInquiryStatus(id: string, status: string) {
  await requireSession();
  if (!INQUIRY_STATUSES.includes(status as (typeof INQUIRY_STATUSES)[number])) {
    throw new Error("INVALID_STATUS");
  }

  await prisma.inquiry.update({
    where: { id },
    data: { status: status as InquiryStatus },
  });

  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath("/admin/inquiries");
}

export async function assignInquiry(id: string, assigneeId: string | null) {
  await requireSession();
  await prisma.inquiry.update({ where: { id }, data: { assigneeId } });
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function addInquiryMemo(id: string, formData: FormData) {
  const session = await requireSession();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  await prisma.inquiryMemo.create({
    data: { inquiryId: id, authorId: session.id, content: content.slice(0, 5000) },
  });

  revalidatePath(`/admin/inquiries/${id}`);
}
