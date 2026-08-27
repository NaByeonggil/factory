-- CreateTable
CREATE TABLE "InquiryReplyFile" (
    "id" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryReplyFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InquiryReplyFile_storageKey_key" ON "InquiryReplyFile"("storageKey");

-- CreateIndex
CREATE INDEX "InquiryReplyFile_replyId_idx" ON "InquiryReplyFile"("replyId");

-- AddForeignKey
ALTER TABLE "InquiryReplyFile" ADD CONSTRAINT "InquiryReplyFile_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "InquiryReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
