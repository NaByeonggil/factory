"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { inquirySchema, type InquiryInput } from "@/lib/validations/inquiry";
import { getRequestMeta } from "@/lib/request-meta";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { notifyNewInquiry } from "@/lib/notify";
import { getStorage } from "@/lib/storage";
import { verifyUploadKey } from "@/lib/upload";
import { toDbLocale } from "@/i18n/routing";
import type { Locale, ServiceType } from "@/generated/prisma/enums";

export type InquiryActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "VALIDATION" | "RATE_LIMIT" | "BOT" | "SERVER"; fieldErrors?: Record<string, string> };

export async function submitInquiry(
  locale: string,
  input: InquiryInput,
): Promise<InquiryActionResult> {
  const parsed = inquirySchema.safeParse(input);
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

  const limited = rateLimit(`inquiry:${meta.ipHash ?? "unknown"}`, 5, 10 * 60 * 1000);
  if (!limited.success) return { ok: false, error: "RATE_LIMIT" };

  const humanVerified = await verifyTurnstile(data.turnstileToken, meta.ip ?? undefined);
  if (!humanVerified) return { ok: false, error: "BOT" };

  // 첨부는 /api/uploads 가 발급한 서명 토큰이 있는 것만 인정합니다.
  // 없으면 임의의 storage key를 남의 문의에 붙일 수 있습니다.
  const attachments = data.attachments.filter((file) =>
    verifyUploadKey(file.key, file.token),
  );
  if (attachments.length !== data.attachments.length) {
    return { ok: false, error: "VALIDATION", fieldErrors: { attachments: "첨부파일 검증에 실패했습니다." } };
  }

  try {
    const attribution = data.attribution ?? {};

    const inquiry = await prisma.inquiry.create({
      data: {
        name: data.name,
        company: data.company || null,
        phone: data.phone,
        email: data.email || null,

        title: data.title || null,
        serviceType: data.serviceType as ServiceType,
        formulations: data.formulations,
        packagings: data.packagings,
        quantity: data.quantity || null,
        budget: data.budget || null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,

        targetAudience: data.targetAudience || null,
        healthConcern: data.healthConcern || null,
        materialType: data.materialType || null,
        ownedAssets: data.ownedAssets,
        targetPrice: data.targetPrice || null,
        message: data.message || null,

        privacyAgreedAt: new Date(),
        marketingAgreed: data.marketingAgreed,

        // 견적문의 게시판에서 본인 확인용
        passwordHash: await bcrypt.hash(data.password, 12),

        utmSource: attribution.utmSource ?? null,
        utmMedium: attribution.utmMedium ?? null,
        utmCampaign: attribution.utmCampaign ?? null,
        utmTerm: attribution.utmTerm ?? null,
        naverKeyword: attribution.naverKeyword ?? null,
        naverRank: attribution.naverRank ?? null,
        naverAdGroup: attribution.naverAdGroup ?? null,
        landingPath: attribution.landingPath ?? null,
        referrer: attribution.referrer ?? null,
        rawParams: attribution.rawParams ?? undefined,

        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
        locale: toDbLocale(locale) as Locale,

        files: {
          create: attachments.map((file) => ({
            storageKey: file.key,
            url: `/api/files/${file.key}`,
            filename: file.filename,
            size: file.size,
            mimeType: file.mimeType,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        company: true,
        phone: true,
        email: true,
        serviceType: true,
        message: true,
        naverKeyword: true,
        utmSource: true,
      },
    });

    // 저장이 커밋된 뒤에 알림 — 알림 실패가 접수를 되돌리지 않도록
    await notifyNewInquiry(inquiry);

    return { ok: true, id: inquiry.id };
  } catch (error) {
    console.error("[submitInquiry] 저장 실패", error);

    // 문의가 저장되지 않았으면 방금 올라온 첨부는 고아가 되므로 정리합니다
    const storage = getStorage();
    await Promise.all(
      attachments.map((file) =>
        storage.delete(file.key).catch(() => undefined),
      ),
    );

    return { ok: false, error: "SERVER" };
  }
}
