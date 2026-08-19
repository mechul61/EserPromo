/**
 * Anasayfa vitrin kategorilerini ayarlar.
 *
 *   npm run categories:homepage-defaults
 */

import "dotenv/config";
import { DEFAULT_HOMEPAGE_CATEGORY_IDS } from "../data/homepage-categories";
import { prisma } from "../lib/db";

async function main() {
  const ids = [...DEFAULT_HOMEPAGE_CATEGORY_IDS];

  await prisma.category.updateMany({
    where: { removed: false },
    data: { showOnHomepage: false },
  });

  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    const updated = await prisma.category.updateMany({
      where: { id, removed: false },
      data: { showOnHomepage: true, homepageOrder: i + 1 },
    });
    if (!updated.count) {
      console.warn(`[homepage] kategori bulunamadı: ${id}`);
    } else {
      const cat = await prisma.category.findUnique({ where: { id }, select: { name: true } });
      console.log(`[homepage] ${i + 1}. ${cat?.name ?? id}`);
    }
  }

  const visible = await prisma.category.count({ where: { showOnHomepage: true, removed: false } });
  console.log("[homepage] tamam", { visible });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
