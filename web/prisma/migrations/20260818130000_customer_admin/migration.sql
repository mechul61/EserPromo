-- CreateEnum
CREATE TYPE "CustomerGroup" AS ENUM ('retail', 'wholesale', 'vip');

-- CreateEnum
CREATE TYPE "CustomerSource" AS ENUM ('website', 'social', 'email', 'other');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "city" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "customerGroup" "CustomerGroup" NOT NULL DEFAULT 'retail';
ALTER TABLE "User" ADD COLUMN "source" "CustomerSource" NOT NULL DEFAULT 'website';
ALTER TABLE "User" ADD COLUMN "blocked" BOOLEAN NOT NULL DEFAULT false;

-- CreateSequence
CREATE SEQUENCE "User_publicNo_seq" START WITH 10001;

ALTER TABLE "User" ADD COLUMN "publicNo" INTEGER;
UPDATE "User" SET "publicNo" = nextval('"User_publicNo_seq"');
ALTER TABLE "User" ALTER COLUMN "publicNo" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "publicNo" SET DEFAULT nextval('"User_publicNo_seq"');
ALTER SEQUENCE "User_publicNo_seq" OWNED BY "User"."publicNo";

CREATE UNIQUE INDEX "User_publicNo_key" ON "User"("publicNo");
CREATE INDEX "User_role_isActive_blocked_idx" ON "User"("role", "isActive", "blocked");
CREATE INDEX "User_customerGroup_idx" ON "User"("customerGroup");
CREATE INDEX "User_city_idx" ON "User"("city");
