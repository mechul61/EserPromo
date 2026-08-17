-- AlterTable
ALTER TABLE "TransferBank" ADD COLUMN "displayName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "TransferBank" ADD COLUMN "holderName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "TransferBank" ADD COLUMN "iban" TEXT NOT NULL DEFAULT '';
ALTER TABLE "TransferBank" ADD COLUMN "accountType" TEXT NOT NULL DEFAULT 'Vadesiz TL';
