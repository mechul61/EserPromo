-- CreateTable
CREATE TABLE "TransferBank" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferBank_pkey" PRIMARY KEY ("id")
);
