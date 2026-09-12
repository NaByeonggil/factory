-- 견적서 항목 — 공개 페이지(/quote)의 「견적서에 담기는 것」을 관리자 전용으로 옮깁니다
CREATE TABLE "QuoteItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteItem_sortOrder_idx" ON "QuoteItem"("sortOrder");

-- 기존 메시지 파일(quote.quoteRows)에 있던 9개 항목을 그대로 옮겨 심습니다.
-- 관리자가 여기서 이어서 고칠 수 있도록 데이터 이전까지 이 마이그레이션에서 끝냅니다.
INSERT INTO "QuoteItem" ("id", "title", "body", "sortOrder", "updatedAt") VALUES
  ('quoteitem-spec',        '제품 사양',   '제형, 1일 섭취량, 내용량, 포장 형태',                                          1, CURRENT_TIMESTAMP),
  ('quoteitem-formula',     '원료 설계',   '주원료·부원료, 기능성 전략, 차별화 포인트',                                    2, CURRENT_TIMESTAMP),
  ('quoteitem-volume',      '생산 수량',   'MOQ, 초도 생산수량, 추가 생산 단위',                                           3, CURRENT_TIMESTAMP),
  ('quoteitem-price',       '단가 · 총액', '원료비, 제조·포장비, 부가세, 금형·인쇄판 등 일회성 비용을 나눠 표기',          4, CURRENT_TIMESTAMP),
  ('quoteitem-development', '개발비',      '처방 설계, 샘플, 시험·검사, 품목제조신고 지원 범위',                           5, CURRENT_TIMESTAMP),
  ('quoteitem-leadtime',    '납기',        '샘플 확정일 기준 예상 생산·출고일',                                            6, CURRENT_TIMESTAMP),
  ('quoteitem-scope',       '포함 · 제외', '디자인, 패키지 인쇄, 배송·보관, 광고 심의 포함 여부',                          7, CURRENT_TIMESTAMP),
  ('quoteitem-payment',     '결제 조건',   '계약금·중도금·잔금, 샘플·본생산 취소 기준',                                    8, CURRENT_TIMESTAMP),
  ('quoteitem-quality',     '품질 기준',   '협력 제조사의 GMP 적합 여부와 품질관리 범위',                                  9, CURRENT_TIMESTAMP);
