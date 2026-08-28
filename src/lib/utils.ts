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

/**
 * 최근 글은 「2일 전」처럼 상대 시간으로, 일주일이 지나면 날짜로 보여줍니다.
 * 목록에서 방금 올라온 글을 알아보기 쉽게 하려는 것입니다.
 */
export function formatRelativeDate(date: Date | string, locale = "ko-KR") {
  const target = new Date(date);
  const days = Math.floor((Date.now() - target.getTime()) / 86_400_000);
  if (days < 0 || days > 6) return formatDate(target, locale);
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-days, "day");
  } catch {
    return formatDate(target, locale);
  }
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

/** 공개 게시판용 이름 마스킹 — 홍길동 → 홍*동, 김철 → 김* */
export function maskName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return `${trimmed[0]}${"*".repeat(trimmed.length - 2)}${trimmed.at(-1)}`;
}
