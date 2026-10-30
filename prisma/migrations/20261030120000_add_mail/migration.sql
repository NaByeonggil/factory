-- Gmail 받은편지함 분류·요약
CREATE TYPE "MailStatus" AS ENUM ('PENDING', 'DONE', 'FAILED');

CREATE TYPE "MailCategory" AS ENUM ('INQUIRY', 'QUOTE_ORDER', 'SUPPLIER', 'INVOICE', 'REGULATORY', 'PROMO', 'OTHER');

CREATE TABLE "MailAccount" (
    "id" TEXT NOT NULL DEFAULT 'gmail',
    "email" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "applyLabels" BOOLEAN NOT NULL DEFAULT false,
    "syncCursor" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lockedUntil" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Mail" (
    "id" TEXT NOT NULL,
    "accountEmail" TEXT NOT NULL,
    "gmailId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "fromName" TEXT,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "attachmentNames" TEXT[],
    "status" "MailStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "failReason" TEXT,
    "category" "MailCategory",
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT[],
    "company" TEXT,
    "product" TEXT,
    "quantity" TEXT,
    "dueDate" TEXT,
    "action" TEXT,
    "labeledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Mail_gmailId_key" ON "Mail"("gmailId");
CREATE INDEX "Mail_accountEmail_receivedAt_idx" ON "Mail"("accountEmail", "receivedAt");
CREATE INDEX "Mail_status_idx" ON "Mail"("status");
CREATE INDEX "Mail_category_idx" ON "Mail"("category");
