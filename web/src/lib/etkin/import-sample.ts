/**
 * WordPress’ten alınan örnek JSON’u DB + storage’a yazar.
 * API IP engelli olsa bile yerel yapıyı doğrulamak için.
 *
 *   npm run sync:import-sample
 */

import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../db";
import { getEnv } from "../env";
import { upsertCategory, upsertProductTree } from "./catalog";
import type { EtkinCategory, EtkinProduct } from "./types";

async function main() {
  const env = getEnv();
  const fixturePath = path.resolve(
    process.cwd(),
    "fixtures/etkin-product-4517.json",
  );
  const raw = JSON.parse(await readFile(fixturePath, "utf8")) as {
    urun: EtkinProduct;
    kategori: EtkinCategory;
    ust_kategori?: EtkinCategory;
  };

  console.log("[import] fixture:", fixturePath);

  if (raw.ust_kategori) {
    await upsertCategory(raw.ust_kategori, {
      storageRoot: env.STORAGE_PATH,
      siteDomain: env.SITE_DOMAIN,
      downloadImage: false,
    });
  }

  await upsertCategory(raw.kategori, {
    storageRoot: env.STORAGE_PATH,
    siteDomain: env.SITE_DOMAIN,
    downloadImage: true,
  });

  const stats = await upsertProductTree(raw.urun, {
    storageRoot: env.STORAGE_PATH,
    siteDomain: env.SITE_DOMAIN,
    downloadImages: true,
  });

  const product = await prisma.product.findUnique({
    where: { id: raw.urun.urun_id },
    include: {
      images: true,
      category: true,
    },
  });

  const siblings = await prisma.product.count({
    where: { skuGroup: raw.urun.urun_kodgrup || raw.urun.urun_kodu },
  });

  console.log("[import] OK", {
    productsUpserted: stats.products,
    imagesDownloaded: stats.imagesDownloaded,
    product: product
      ? {
          id: product.id,
          sku: product.sku,
          skuGroup: product.skuGroup,
          name: product.name,
          color: product.color,
          price: product.price.toString(),
          stock: product.stockTotal,
          isGroupPrimary: product.isGroupPrimary,
          category: product.category.name,
          images: product.images.map((i) => i.localPath),
        }
      : null,
    siblingsInGroup: siblings,
  });
}

main()
  .catch((error) => {
    console.error("[import] hata:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
