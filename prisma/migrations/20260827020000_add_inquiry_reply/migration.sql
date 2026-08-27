-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "replyBody" TEXT,
ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "repliedById" TEXT;

-- CreateIndex
CREATE INDEX "Inquiry_repliedById_idx" ON "Inquiry"("repliedById");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_repliedById_fkey" FOREIGN KEY ("repliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
