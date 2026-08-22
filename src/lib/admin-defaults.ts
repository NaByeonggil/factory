import { DB_LOCALES, type DbLocale } from "@/lib/validations/admin";

/** 번역 폼의 빈 기본값 (모든 언어 × 지정 필드) */
export function emptyTranslations<F extends string>(fields: readonly F[]) {
  return Object.fromEntries(
    DB_LOCALES.map((locale) => [
      locale,
      Object.fromEntries(fields.map((f) => [f, ""])) as Record<F, string>,
    ]),
  ) as Record<DbLocale, Record<F, string>>;
}

/** DB 번역 행 배열을 폼 값 형태로 병합 */
export function mergeTranslations<F extends string>(
  fields: readonly F[],
  rows: ({ locale: DbLocale } & Partial<Record<F, string | null>>)[],
) {
  const base = emptyTranslations(fields);
  for (const row of rows) {
    for (const field of fields) {
      base[row.locale][field] = row[field] ?? "";
    }
  }
  return base;
}

/** Date -> <input type="datetime-local"> 값 (로컬 타임존 기준) */
export function toDatetimeLocal(date: Date | null) {
  if (!date) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
