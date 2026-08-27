-- CreateTable
CREATE TABLE "Popup" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Popup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopupTranslation" (
    "id" TEXT NOT NULL,
    "popupId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "linkLabel" TEXT,

    CONSTRAINT "PopupTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Popup_slug_key" ON "Popup"("slug");

-- CreateIndex
CREATE INDEX "Popup_isPublished_sortOrder_idx" ON "Popup"("isPublished", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PopupTranslation_popupId_locale_key" ON "PopupTranslation"("popupId", "locale");

-- AddForeignKey
ALTER TABLE "PopupTranslation" ADD CONSTRAINT "PopupTranslation_popupId_fkey" FOREIGN KEY ("popupId") REFERENCES "Popup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
