CREATE TYPE "PopupKind" AS ENUM ('subscribe', 'promo', 'info');
CREATE TYPE "PopupPlacement" AS ENUM ('home', 'all', 'category', 'product', 'cart');
CREATE TYPE "PopupDevice" AS ENUM ('all', 'desktop', 'mobile');
CREATE TYPE "PopupAudience" AS ENUM ('all', 'new_visitors', 'returning', 'logged_in');

CREATE TABLE "Popup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" "PopupKind" NOT NULL DEFAULT 'subscribe',
    "placement" "PopupPlacement" NOT NULL DEFAULT 'all',
    "device" "PopupDevice" NOT NULL DEFAULT 'all',
    "audience" "PopupAudience" NOT NULL DEFAULT 'all',
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imagePath" TEXT NOT NULL DEFAULT '',
    "heading" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "ctaLabel" TEXT NOT NULL DEFAULT '',
    "ctaHref" TEXT NOT NULL DEFAULT '',
    "couponCode" TEXT NOT NULL DEFAULT '',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "delaySeconds" INTEGER NOT NULL DEFAULT 2,
    "frequencyHours" INTEGER NOT NULL DEFAULT 24,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Popup_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Popup_isActive_isDraft_startsAt_endsAt_idx" ON "Popup"("isActive", "isDraft", "startsAt", "endsAt");
CREATE INDEX "Popup_placement_isActive_idx" ON "Popup"("placement", "isActive");

CREATE TABLE "PopupSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "popupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PopupSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PopupSubscriber_email_key" ON "PopupSubscriber"("email");
CREATE INDEX "PopupSubscriber_createdAt_idx" ON "PopupSubscriber"("createdAt");
