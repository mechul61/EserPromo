-- CreateTable
CREATE TABLE "SiteAnalyticsDay" (
    "day" TEXT NOT NULL,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "visitors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteAnalyticsDay_pkey" PRIMARY KEY ("day")
);

-- CreateTable
CREATE TABLE "SiteVisitorDay" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,

    CONSTRAINT "SiteVisitorDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteVisitorDay_day_idx" ON "SiteVisitorDay"("day");
