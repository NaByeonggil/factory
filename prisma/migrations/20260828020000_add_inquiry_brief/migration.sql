-- 제품 기획 브리프 항목
ALTER TABLE "Inquiry"
  ADD COLUMN "targetAudience" TEXT,
  ADD COLUMN "healthConcern" TEXT,
  ADD COLUMN "materialType" TEXT,
  ADD COLUMN "ownedAssets" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "targetPrice" TEXT;
