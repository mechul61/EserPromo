-- AlterTable
ALTER TABLE "Product" ADD COLUMN "showOnHomepage" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Product_isActive_showOnHomepage_isGroupPrimary_idx" ON "Product"("isActive", "showOnHomepage", "isGroupPrimary");
