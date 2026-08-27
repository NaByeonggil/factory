import { z } from "zod";
import {
  FORMULATIONS,
  INGREDIENT_CATEGORIES,
  SERVICE_TYPES,
} from "@/lib/constants";

export const DB_LOCALES = ["KO", "EN", "ZH"] as const;
export type DbLocale = (typeof DB_LOCALES)[number];

/** 소문자·숫자·하이픈만. URL에 그대로 노출됩니다. */
export const slugSchema = z
  .string()
  .trim()
  .min(2, "slug는 2자 이상이어야 합니다.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug는 소문자·숫자·하이픈만 사용할 수 있습니다.");

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

/**
 * 업로드된 이미지는 `/api/media/pub/...` 상대 경로이고,
 * 외부 CDN을 직접 붙일 수도 있으므로 둘 다 허용합니다.
 */
const IMAGE_URL = /^(https?:\/\/|\/api\/media\/pub\/)/;

const optionalUrl = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .transform((v) => (v ? v : null))
  .refine(
    (v) => v === null || IMAGE_URL.test(v),
    "이미지를 업로드하거나 http(s):// 주소를 입력하세요.",
  );

// ───────────────────────── 원료 ─────────────────────────

export const ingredientTranslationSchema = z.object({
  name: z.string().trim().max(120),
  summary: optionalText(300),
  functionality: optionalText(2000),
  dailyDose: optionalText(120),
  body: optionalText(20000),
  seoTitle: optionalText(120),
  seoDesc: optionalText(300),
});

export const ingredientSchema = z.object({
  slug: slugSchema,
  category: z.enum(INGREDIENT_CATEGORIES),
  thumbnailUrl: optionalUrl,
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  translations: z.record(z.enum(DB_LOCALES), ingredientTranslationSchema),
});

// ───────────────────────── 게시물 ─────────────────────────

export const postTranslationSchema = z.object({
  title: z.string().trim().max(200),
  excerpt: optionalText(400),
  body: z.string().trim().max(50000),
  seoTitle: optionalText(120),
  seoDesc: optionalText(300),
});

export const postSchema = z.object({
  slug: slugSchema,
  category: z.enum(["NEWS", "NOTICE", "ESG", "FACTORY_TOUR"]),
  coverUrl: optionalUrl,
  /** 비우면 미발행(초안) */
  publishedAt: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? new Date(v) : null))
    .refine(
      (v) => v === null || !Number.isNaN(v.getTime()),
      "게시일 형식이 올바르지 않습니다.",
    ),
  translations: z.record(z.enum(DB_LOCALES), postTranslationSchema),
});

// ─────────────────────── 포트폴리오 ───────────────────────

export const productTranslationSchema = z.object({
  title: z.string().trim().max(200),
  description: optionalText(5000),
  seoTitle: optionalText(120),
  seoDesc: optionalText(300),
});

export const productSchema = z.object({
  slug: slugSchema,
  serviceType: z.enum(SERVICE_TYPES),
  formulation: z.enum(FORMULATIONS),
  imageUrls: z.array(z.string().trim().regex(IMAGE_URL)).max(6),
  ingredientIds: z.array(z.string()).max(30),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  translations: z.record(z.enum(DB_LOCALES), productTranslationSchema),
});

// ─────────────────────── 팝업 공지 ───────────────────────

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine(
    (v) => v === null || !Number.isNaN(v.getTime()),
    "날짜 형식이 올바르지 않습니다.",
  );

export const popupTranslationSchema = z.object({
  title: z.string().trim().max(60),
  body: optionalText(300),
  linkLabel: optionalText(30),
});

export const popupSchema = z
  .object({
    slug: slugSchema,
    imageUrl: optionalUrl,
    /** 내부 경로(/ko/...) 또는 http(s) 주소 */
    linkUrl: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((v) => (v ? v : null))
      .refine(
        (v) => v === null || /^(https?:\/\/|\/)/.test(v),
        "/ 로 시작하는 내부 경로 또는 http(s):// 주소를 입력하세요.",
      ),
    startsAt: optionalDate,
    endsAt: optionalDate,
    isPublished: z.boolean(),
    sortOrder: z.coerce.number().int().min(0).max(9999),
    translations: z.record(z.enum(DB_LOCALES), popupTranslationSchema),
  })
  .refine(
    (v) => !v.startsAt || !v.endsAt || v.startsAt <= v.endsAt,
    { message: "종료일이 시작일보다 빠릅니다.", path: ["endsAt"] },
  );

// ───────────────────────── 헬퍼 ─────────────────────────

/** `translations.KO.name` 형태의 FormData 키를 중첩 객체로 복원 */
export function parseTranslations<T extends Record<string, unknown>>(
  formData: FormData,
  fields: readonly string[],
): Record<DbLocale, T> {
  const out = {} as Record<DbLocale, T>;
  for (const locale of DB_LOCALES) {
    const entry = {} as Record<string, string>;
    for (const field of fields) {
      entry[field] = String(formData.get(`translations.${locale}.${field}`) ?? "");
    }
    out[locale] = entry as unknown as T;
  }
  return out;
}

/**
 * FormData 스칼라 읽기.
 * 필드가 아예 없으면 get()이 null을 돌려주고 zod 문자열 검증이 실패하므로
 * 항상 문자열로 정규화합니다.
 */
export function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

export function checkbox(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

/** 줄바꿈으로 구분된 textarea 값을 배열로 */
export function lines(formData: FormData, name: string) {
  return String(formData.get(name) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};
