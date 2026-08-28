/**
 * 폼 선택지 코드 정의.
 * 화면에 보이는 라벨은 src/messages/*.json 의 `options.*` 에 있습니다.
 * (운영자가 직접 항목을 추가해야 할 만큼 자주 바뀌면 DB 테이블로 승격)
 */

/** 건강기능식품 제형 */
export const SUPPLEMENT_FORMULATIONS = [
  "PILL", // 환
  "HARD_CAPSULE", // 경질캡슐
  "SOFT_CAPSULE", // 연질캡슐
  "JELLY", // 젤리
  "LIQUID", // 액상
  "POWDER", // 분말
  "TABLET", // 정제
] as const;

/** 화장품 제형 */
export const COSMETIC_FORMULATIONS = [
  "CREAM", // 크림
  "SERUM", // 앰플·세럼
  "TONER", // 토너·스킨
  "LOTION", // 로션·에멀전
  "MASK_PACK", // 마스크팩
  "CLEANSER", // 클렌저
] as const;

/** 생산 가능 제형 전체 (저장·검증용) */
export const FORMULATIONS = [
  ...SUPPLEMENT_FORMULATIONS,
  ...COSMETIC_FORMULATIONS,
] as const;
export type Formulation = (typeof FORMULATIONS)[number];

/** 건강기능식품 포장 방식 */
export const SUPPLEMENT_PACKAGINGS = [
  "MULTI_PACK", // 멀티팩
  "DUAL_FORM", // 이중제형
  "BOTTLE", // 병포장
  "LIQUID_POUCH", // 액상포장
  "PTP", // PTP
  "STICK", // 스틱포장
] as const;

/** 화장품 용기 */
export const COSMETIC_PACKAGINGS = [
  "TUBE", // 튜브
  "PUMP", // 펌프 용기
  "JAR", // 단지·자
  "AIRLESS", // 에어리스
  "SACHET", // 파우치·낱개 포장
] as const;

/** 포장 방식 전체 (저장·검증용) */
export const PACKAGINGS = [
  ...SUPPLEMENT_PACKAGINGS,
  ...COSMETIC_PACKAGINGS,
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

export const SERVICE_TYPES = [
  "OEM",
  "ODM",
  "CDMO",
  "DTC",
  "PET",
  "COSMETIC",
  "MATERIAL",
] as const;
export type ServiceTypeCode = (typeof SERVICE_TYPES)[number];

/**
 * 식품 생산문의 게시판이 모으는 유형 — 건강기능식품과 일반식품.
 * 화장품·펫·원료 공급은 각자 전용 게시판이 따로 있습니다.
 */
export const FOOD_SERVICE_TYPES = ["OEM", "ODM", "CDMO", "DTC"] as const;

/** 그 문의가 실린 게시판 경로 — 상세에서 목록으로 돌아갈 때 씁니다 */
export function boardPathFor(serviceType: string) {
  if (serviceType === "PET") return "/quote/pet";
  if (serviceType === "COSMETIC") return "/quote/cosmetic";
  if (serviceType === "MATERIAL") return "/quote/material";
  return "/quote";
}

/**
 * 문의 유형에 맞는 제형·포장 선택지.
 * 화장품 문의에 건기식 제형이 뜨지 않도록 폼에서 이 함수로 갈라 씁니다.
 */
export function formulationsFor(serviceType: string) {
  // 원료 공급 문의는 완제품 제형을 고르지 않습니다
  if (serviceType === "MATERIAL") return [] as const;
  return serviceType === "COSMETIC"
    ? COSMETIC_FORMULATIONS
    : SUPPLEMENT_FORMULATIONS;
}

export function packagingsFor(serviceType: string) {
  if (serviceType === "MATERIAL") return [] as const;
  return serviceType === "COSMETIC"
    ? COSMETIC_PACKAGINGS
    : SUPPLEMENT_PACKAGINGS;
}

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
