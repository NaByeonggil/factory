"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { MAIL_CATEGORIES } from "@/lib/constants";
import { revokeToken } from "@/lib/gmail";
import { syncMail } from "@/lib/mail-sync";
import { prisma } from "@/lib/prisma";

const ACCOUNT_ID = "gmail";
/** 화면에서 기다리는 동기화라 정리 건수를 줄입니다. 나머지는 타이머가 이어서 합니다 */
const MANUAL_CLASSIFY_LIMIT = 5;

export async function syncMailNow() {
  await requireSession(["ADMIN"]);
  await syncMail({ classifyLimit: MANUAL_CLASSIFY_LIMIT });
  revalidatePath("/admin/mail");
}

export async function setMailApplyLabels(applyLabels: boolean) {
  await requireSession(["ADMIN"]);
  await prisma.mailAccount.update({
    where: { id: ACCOUNT_ID },
    data: { applyLabels },
  });
  if (applyLabels) await syncMail({ classifyLimit: 0 });
  revalidatePath("/admin/mail");
}

/** 분류를 사람이 고치면 라벨도 다시 답니다 */
export async function updateMailCategory(id: string, category: string) {
  await requireSession(["ADMIN"]);
  const parsed = z.enum(MAIL_CATEGORIES).safeParse(category);
  if (!parsed.success) throw new Error("INVALID_CATEGORY");

  await prisma.mail.update({
    where: { id },
    data: { category: parsed.data, labeledAt: null },
  });
  await syncMail({ classifyLimit: 0 });
  revalidatePath("/admin/mail");
}

export async function retryMail(id: string) {
  await requireSession(["ADMIN"]);
  await prisma.mail.update({
    where: { id },
    data: { status: "PENDING", attempts: 0, failReason: null },
  });
  revalidatePath("/admin/mail");
}

/** Google 권한을 취소하고 연결 정보를 지웁니다. 정리된 메일 기록은 남습니다 */
export async function disconnectGmail() {
  await requireSession(["ADMIN"]);
  const account = await prisma.mailAccount.findUnique({
    where: { id: ACCOUNT_ID },
  });
  if (!account) return;

  await revokeToken(account.refreshToken);
  await prisma.mailAccount.delete({ where: { id: ACCOUNT_ID } });
  revalidatePath("/admin/mail");
}
