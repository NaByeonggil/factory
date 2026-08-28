import { z } from "zod";
import {
  BUDGET_RANGES,
  FORMULATIONS,
  MATERIAL_TYPES,
  OWNED_ASSETS,
  PACKAGINGS,
  QUANTITY_RANGES,
  SERVICE_TYPES,
} from "@/lib/constants";

/** 국내 휴대폰/유선 모두 허용 (숫자 9~13자리) */
const phoneRegex = /^[0-9+\-() ]{9,20}$/;

export const attributionSchema = z.object({
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
  utmTerm: z.string().max(255).optional(),
  naverKeyword: z.string().max(255).optional(),
  naverRank: z.string().max(32).optional(),
  naverAdGroup: z.string().max(255).optional(),
  landingPath: z.string().max(512).optional(),
  referrer: z.string().max(1024).optional(),
  rawParams: z.record(z.string(), z.string()).optional(),
});

export const inquirySchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(50),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "phoneInvalid")
    .refine((v) => v.replace(/\D/g, "").length >= 9, "phoneInvalid"),
  email: z.email("emailInvalid").max(150).optional().or(z.literal("")),

  /** 게시판 목록에 노출되는 제목. 비우면 서비스 유형으로 자동 생성 */
  title: z.string().trim().max(100, "titleTooLong").optional().or(z.literal("")),
  serviceType: z.enum(SERVICE_TYPES).default("OEM"),
  formulations: z.array(z.enum(FORMULATIONS)).max(FORMULATIONS.length).default([]),
  packagings: z.array(z.enum(PACKAGINGS)).max(PACKAGINGS.length).default([]),
  quantity: z.enum(QUANTITY_RANGES).optional().or(z.literal("")),
  budget: z.enum(BUDGET_RANGES).optional().or(z.literal("")),
  targetDate: z.string().optional().or(z.literal("")),

  // 제품 기획 브리프
  targetAudience: z.string().trim().max(200).optional().or(z.literal("")),
  healthConcern: z.string().trim().max(200).optional().or(z.literal("")),
  materialType: z.enum(MATERIAL_TYPES).optional().or(z.literal("")),
  ownedAssets: z.array(z.enum(OWNED_ASSETS)).max(OWNED_ASSETS.length).default([]),
  targetPrice: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().max(5000, "messageTooLong").optional().or(z.literal("")),

  /** 견적문의 게시판에서 본인 문의·답변을 열람할 때 쓰는 비밀번호 */
  password: z.string().min(4, "passwordTooShort").max(50),

  privacyAgreed: z
    .boolean()
    .refine((v) => v === true, { message: "privacyRequired" }),
  marketingAgreed: z.boolean().default(false),

  /**
   * 봇 트랩 — 사람이라면 비어 있어야 함.
   * 여기서 max(0)으로 거절하면 어떤 필드가 트랩인지 봇에게 알려주게 되므로
   * 스키마는 통과시키고 서버 액션에서 조용히 차단합니다.
   */
  website: z.string().max(500).optional(),

  attachments: z
    .array(
      z.object({
        key: z.string().min(1).max(200),
        token: z.string().length(64),
        filename: z.string().min(1).max(150),
        size: z.number().int().positive(),
        mimeType: z.string().max(150),
      }),
    )
    .max(3)
    .default([]),

  attribution: attributionSchema.optional(),
  turnstileToken: z.string().optional(),
});

export type InquiryInput = z.input<typeof inquirySchema>;
export type InquiryValues = z.output<typeof inquirySchema>;
