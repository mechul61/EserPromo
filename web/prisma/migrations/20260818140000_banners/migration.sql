-- CreateEnum
CREATE TYPE "BannerKind" AS ENUM ('banner', 'slider');

-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('hero', 'middle_1', 'middle_2', 'bottom', 'side', 'category');

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "kind" "BannerKind" NOT NULL DEFAULT 'banner',
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL DEFAULT '',
    "imagePath" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 600,
    "placement" "BannerPlacement" NOT NULL DEFAULT 'hero',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Banner_kind_isActive_sortOrder_idx" ON "Banner"("kind", "isActive", "sortOrder");
CREATE INDEX "Banner_placement_isActive_sortOrder_idx" ON "Banner"("placement", "isActive", "sortOrder");
