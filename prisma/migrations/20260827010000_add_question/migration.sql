-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "answerBody" TEXT,
    "answeredAt" TIMESTAMP(3),
    "answeredById" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'KO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_locale_isPublished_createdAt_idx" ON "Question"("locale", "isPublished", "createdAt");

-- CreateIndex
CREATE INDEX "Question_answeredAt_idx" ON "Question"("answeredAt");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
