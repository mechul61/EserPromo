CREATE TYPE "ReportCategory" AS ENUM ('sales', 'customer', 'product', 'finance', 'marketing', 'other');
CREATE TYPE "ReportKindType" AS ENUM ('table', 'chart');
CREATE TYPE "ReportSchedule" AS ENUM ('none', 'daily', 'weekly', 'monthly');

CREATE TABLE "SavedReport" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "kind" "ReportKindType" NOT NULL DEFAULT 'table',
    "icon" TEXT NOT NULL DEFAULT 'chart',
    "schedule" "ReportSchedule" NOT NULL DEFAULT 'none',
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "creatorName" TEXT NOT NULL DEFAULT 'Yönetici',
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedReport_key_key" ON "SavedReport"("key");
CREATE INDEX "SavedReport_category_isShared_idx" ON "SavedReport"("category", "isShared");
CREATE INDEX "SavedReport_schedule_idx" ON "SavedReport"("schedule");

CREATE TABLE "ReportRun" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReportRun_reportId_createdAt_idx" ON "ReportRun"("reportId", "createdAt");
CREATE INDEX "ReportRun_action_createdAt_idx" ON "ReportRun"("action", "createdAt");

ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "SavedReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
