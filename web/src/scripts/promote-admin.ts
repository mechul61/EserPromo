import "dotenv/config";
import { prisma } from "../lib/db";
import { normalizeEmail } from "../lib/security/crypto";

async function main() {
  const email = normalizeEmail(process.argv[2] || "");
  if (!email) {
    console.error("Kullanım: npm run admin:promote -- eposta@ornek.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Bu e-posta ile üye yok: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin", isActive: true },
  });
  console.log(`Yönetici yapıldı: ${user.name} <${email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
