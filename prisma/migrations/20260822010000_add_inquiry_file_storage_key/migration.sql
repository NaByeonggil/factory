-- AlterTable
ALTER TABLE "InquiryFile" ADD COLUMN     "storageKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "InquiryFile_storageKey_key" ON "InquiryFile"("storageKey");
