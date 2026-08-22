-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('KO', 'EN', 'ZH');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('OEM', 'ODM', 'CDMO', 'DTC', 'PET');

-- CreateEnum
CREATE TYPE "IngredientCategory" AS ENUM ('INDIVIDUAL_APPROVED', 'PATENT', 'BASIC', 'HOT_TREND', 'SUPERFOOD');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'CONTRACTED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "PostCategory" AS ENUM ('NEWS', 'NOTICE', 'ESG', 'FACTORY_TOUR');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'SALES');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "serviceType" "ServiceType" NOT NULL DEFAULT 'OEM',
    "formulations" TEXT[],
    "packagings" TEXT[],
    "quantity" TEXT,
    "budget" TEXT,
    "targetDate" TIMESTAMP(3),
    "message" TEXT,
    "privacyAgreedAt" TIMESTAMP(3) NOT NULL,
    "marketingAgreed" BOOLEAN NOT NULL DEFAULT false,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "naverKeyword" TEXT,
    "naverRank" TEXT,
    "naverAdGroup" TEXT,
    "landingPath" TEXT,
    "referrer" TEXT,
    "rawParams" JSONB,
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "assigneeId" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "locale" "Locale" NOT NULL DEFAULT 'KO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryFile" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InquiryMemo" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InquiryMemo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "IngredientCategory" NOT NULL,
    "thumbnailUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngredientTranslation" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "functionality" TEXT,
    "dailyDose" TEXT,
    "body" TEXT,
    "seoTitle" TEXT,
    "seoDesc" TEXT,

    CONSTRAINT "IngredientTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "formulation" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "seoTitle" TEXT,
    "seoDesc" TEXT,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "PostCategory" NOT NULL,
    "coverUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTranslation" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "seoTitle" TEXT,
    "seoDesc" TEXT,

    CONSTRAINT "PostTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "imageUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SALES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductIngredients" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductIngredients_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_utmSource_naverKeyword_idx" ON "Inquiry"("utmSource", "naverKeyword");

-- CreateIndex
CREATE INDEX "Inquiry_assigneeId_idx" ON "Inquiry"("assigneeId");

-- CreateIndex
CREATE INDEX "InquiryFile_inquiryId_idx" ON "InquiryFile"("inquiryId");

-- CreateIndex
CREATE INDEX "InquiryMemo_inquiryId_createdAt_idx" ON "InquiryMemo"("inquiryId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_slug_key" ON "Ingredient"("slug");

-- CreateIndex
CREATE INDEX "Ingredient_category_isPublished_sortOrder_idx" ON "Ingredient"("category", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "Ingredient_isFeatured_sortOrder_idx" ON "Ingredient"("isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "IngredientTranslation_locale_idx" ON "IngredientTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientTranslation_ingredientId_locale_key" ON "IngredientTranslation"("ingredientId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_isPublished_sortOrder_idx" ON "Product"("isPublished", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Post_slug_key" ON "Post"("slug");

-- CreateIndex
CREATE INDEX "Post_category_publishedAt_idx" ON "Post"("category", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PostTranslation_postId_locale_key" ON "PostTranslation"("postId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_code_key" ON "Certification"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "_ProductIngredients_B_index" ON "_ProductIngredients"("B");

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryFile" ADD CONSTRAINT "InquiryFile_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMemo" ADD CONSTRAINT "InquiryMemo_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InquiryMemo" ADD CONSTRAINT "InquiryMemo_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngredientTranslation" ADD CONSTRAINT "IngredientTranslation_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTranslation" ADD CONSTRAINT "PostTranslation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductIngredients" ADD CONSTRAINT "_ProductIngredients_A_fkey" FOREIGN KEY ("A") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductIngredients" ADD CONSTRAINT "_ProductIngredients_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
