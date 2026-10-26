-- 외부 시스템(AI 견적)에서 들어온 문의의 원본 ID와 접수 경로
ALTER TABLE "Inquiry"
  ADD COLUMN "externalId" TEXT,
  ADD COLUMN "source" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_externalId_key" ON "Inquiry"("externalId");
