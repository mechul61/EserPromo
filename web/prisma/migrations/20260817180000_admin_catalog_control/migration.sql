-- AlterTable
ALTER TABLE "Category" ADD COLUMN "adminLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Category" ADD COLUMN "removed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "adminLocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "removed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Category_removed_idx" ON "Category"("removed");

-- CreateIndex
CREATE INDEX "Product_removed_idx" ON "Product"("removed");
