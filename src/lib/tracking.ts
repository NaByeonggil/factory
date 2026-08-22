/**
 * 광고 유입 정보(attribution).
 * 랜딩 시점에 캡처해두지 않으면 문의 페이지로 이동하는 순간 유실됩니다.
 */
export const ATTRIBUTION_STORAGE_KEY = "fastlab_attribution";

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  naverKeyword?: string;
  naverRank?: string;
  naverAdGroup?: string;
  landingPath?: string;
  referrer?: string;
  rawParams?: Record<string, string>;
};

/** 추적에 쓰는 쿼리 파라미터만 화이트리스트로 보관 */
const TRACKED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "n_media",
  "n_query",
  "n_rank",
  "n_ad_group",
  "n_ad",
  "n_keyword",
  "n_keyword_id",
  "n_campaign_type",
  "n_ad_group_type",
  "n_match",
  "NaPm",
  "gclid",
  "fbclid",
];

export function parseAttribution(
  search: URLSearchParams,
  pathname: string,
  referrer: string,
): Attribution {
  const raw: Record<string, string> = {};
  for (const key of TRACKED_PARAMS) {
    const value = search.get(key);
    if (value) raw[key] = value.slice(0, 512);
  }

  return {
    utmSource: search.get("utm_source") ?? undefined,
    utmMedium: search.get("utm_medium") ?? undefined,
    utmCampaign: search.get("utm_campaign") ?? undefined,
    utmTerm: search.get("utm_term") ?? undefined,
    naverKeyword: search.get("n_keyword") ?? search.get("n_query") ?? undefined,
    naverRank: search.get("n_rank") ?? undefined,
    naverAdGroup: search.get("n_ad_group") ?? undefined,
    landingPath: pathname,
    referrer: referrer || undefined,
    rawParams: Object.keys(raw).length ? raw : undefined,
  };
}

export function hasAnySignal(a: Attribution) {
  return Boolean(
    a.utmSource || a.utmMedium || a.utmCampaign || a.naverKeyword || a.referrer,
  );
}

/** sessionStorage에 저장된 최초 유입 정보 읽기 (클라이언트 전용) */
export function readStoredAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}
