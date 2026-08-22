import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Intl은 잘못된 언어 태그에 RangeError를 던집니다.
 * locale이 URL 세그먼트에서 오므로(`/.env` 같은 봇 요청) 반드시 방어합니다.
 */
function intlDate(locale: string, options: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat(locale, options);
  } catch {
    return new Intl.DateTimeFormat("ko-KR", options);
  }
}

export function formatDateTime(date: Date | string, locale = "ko-KR") {
  return intlDate(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(date),
  );
}

export function formatDate(date: Date | string, locale = "ko-KR") {
  return intlDate(locale, { dateStyle: "medium" }).format(new Date(date));
}

/** 010-1234-5678 형태로 정규화 */
export function normalizePhone(input: string) {
  return input.replace(/[^0-9]/g, "");
}

/** 목록에서 개인정보 부분 마스킹 */
export function maskPhone(phone: string) {
  const d = normalizePhone(phone);
  if (d.length < 8) return phone;
  return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
}
