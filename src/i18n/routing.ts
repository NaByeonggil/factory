import { defineRouting } from "next-intl/routing";

export const locales = ["ko", "en", "zh"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "ko",
  // 기본 언어도 항상 /ko 프리픽스를 붙여 URL·캐싱·광고 랜딩을 단순화
  localePrefix: "always",
});

/** next-intl locale -> Prisma Locale enum */
export const toDbLocale = (locale: string) =>
  ({ ko: "KO", en: "EN", zh: "ZH" })[locale] ?? "KO";

/** <html lang> / Intl 용 BCP-47 태그 */
export const bcp47: Record<AppLocale, string> = {
  ko: "ko-KR",
  en: "en-US",
  zh: "zh-CN",
};
