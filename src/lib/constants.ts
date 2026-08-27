/**
 * 폼 선택지 코드 정의.
 * 화면에 보이는 라벨은 src/messages/*.json 의 `options.*` 에 있습니다.
 * (운영자가 직접 항목을 추가해야 할 만큼 자주 바뀌면 DB 테이블로 승격)
 */

/** 생산 가능 제형 */
export const FORMULATIONS = [
  "PILL", // 환
  "HARD_CAPSULE", // 경질캡슐
  "SOFT_CAPSULE", // 연질캡슐
  "JELLY", // 젤리
  "LIQUID", // 액상
  "POWDER", // 분말
  "TABLET", // 정제
] as const;
export type Formulation = (typeof FORMULATIONS)[number];

/** 포장 방식 */
export const PACKAGINGS = [
  "MULTI_PACK", // 멀티팩
  "DUAL_FORM", // 이중제형
  "BOTTLE", // 병포장
  "LIQUID_POUCH", // 액상포장
  "PTP", // PTP
  "STICK", // 스틱포장
] as const;
export type Packaging = (typeof PACKAGINGS)[number];

/** 예상 생산 수량 구간 */
export const QUANTITY_RANGES = [
  "UNDER_1K",
  "1K_5K",
  "5K_10K",
  "10K_50K",
  "OVER_50K",
  "UNDECIDED",
] as const;
export type QuantityRange = (typeof QUANTITY_RANGES)[number];

/** 예산 구간 */
export const BUDGET_RANGES = [
  "UNDER_5M",
  "5M_10M",
  "10M_50M",
  "OVER_50M",
  "UNDECIDED",
] as const;
export type BudgetRange = (typeof BUDGET_RANGES)[number];

export const SERVICE_TYPES = ["OEM", "ODM", "CDMO", "DTC", "PET"] as const;

export const INGREDIENT_CATEGORIES = [
  "HOT_TREND",
  "INDIVIDUAL_APPROVED",
  "PATENT",
  "BASIC",
  "SUPERFOOD",
] as const;

export const INQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "CONTRACTED",
  "CLOSED",
  "SPAM",
] as const;

/** 첨부파일 제한 */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

/** 문의 개인정보 보유기간(일) — 경과분은 크론으로 파기 */
export const INQUIRY_RETENTION_DAYS = 365 * 3;

/**
 * 팝업 공지 카드 크기 — 핸드폰 화면 규격 고정.
 * 관리자 폼에서 크기를 받지 않고, 공개 사이트·미리보기가 이 값을 공유합니다.
 */
export const POPUP_SIZE = { width: 320, height: 480 } as const;
