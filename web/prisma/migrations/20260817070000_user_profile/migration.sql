-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "avatarPath" TEXT,
    "companyName" TEXT NOT NULL DEFAULT '',
    "companyTitle" TEXT NOT NULL DEFAULT '',
    "taxOffice" TEXT NOT NULL DEFAULT '',
    "taxNumber" TEXT NOT NULL DEFAULT '',
    "tcKimlik" TEXT NOT NULL DEFAULT '',
    "useCorporateDefault" BOOLEAN NOT NULL DEFAULT false,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySms" BOOLEAN NOT NULL DEFAULT false,
    "notifyOrder" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
