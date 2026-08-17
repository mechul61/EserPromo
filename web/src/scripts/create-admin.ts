import "dotenv/config";
import { prisma } from "../lib/db";
import { hashPassword } from "../lib/auth/password";
import { normalizeEmail } from "../lib/security/crypto";

async function main() {
  const email = normalizeEmail(process.argv[2] || "");
  const name = process.argv[3] || "Yönetici";
  const password = process.argv[4] || "";
  if (!email || !password) {
    console.error("Kullanım: npx tsx src/scripts/create-admin.ts eposta@ornek.com \"Ad Soyad\" \"Sifre\"");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      passwordHash,
      role: "admin",
      isActive: true,
    },
    update: {
      name,
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  console.log(`OK ${user.id} ${user.email} ${user.role}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
