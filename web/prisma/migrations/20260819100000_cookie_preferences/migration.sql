-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN "cookieAnalytics" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserProfile" ADD COLUMN "cookieMarketing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserProfile" ADD COLUMN "cookieConsentAt" TIMESTAMP(3);
