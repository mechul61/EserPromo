/**
 * WordPress hosting'den alınan etkin-dump klasörünü Postgres + storage'a yazar.
 *
 *   npm run sync:import-dump
 *   npm run sync:import-dump -- ./fixtures/etkin-dump
 */

import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../db";
import { getEnv } from "../env";
import { upsertCategory, upsertProductTree } from "./catalog";
import type { EtkinCategory, EtkinProduct } from "./types";

async function main() {
  const env = getEnv();
  let dumpDir = path.resolve(
    process.cwd(),
    process.argv[2] || "fixtures/etkin-dump",
  );

  const nested = path.join(dumpDir, "etkin-dump");
  try {
    await readFile(path.join(dumpDir, "kategoriler.json"));
  } catch {
    dumpDir = nested;
  }

  console.log("[import-dump]", dumpDir);

  const files = (await readdir(dumpDir)).sort();
  const catFile = files.find((f) => f === "kategoriler.json");
  if (!catFile) {
    throw new Error("kategoriler.json yok. Önce WP dump'ın 2. adımını tamamlayın.");
  }

  const catsRaw = JSON.parse(await readFile(path.join(dumpDir, catFile), "utf8"));
  const categories = flattenCategories(catsRaw);
  let categoriesUpsert = 0;
  for (const cat of categories) {
    await upsertCategory(cat, {
      storageRoot: env.STORAGE_PATH,
      siteDomain: env.SITE_DOMAIN,
      downloadImage: true,
    });
    categoriesUpsert += 1;
  }
  console.log("[import-dump] kategoriler:", categoriesUpsert);

  const productFiles = files.filter((f) => /^urunler-\d+\.json$/i.test(f));
  if (productFiles.length === 0) {
    throw new Error("urunler-*.json yok. WP dump'ın 3. adımını tamamlayın.");
  }

  let productsUpserted = 0;
  let imagesDownloaded = 0;
  for (const file of productFiles) {
    const raw = JSON.parse(await readFile(path.join(dumpDir, file), "utf8"));
    const list = normalizeProductList(raw);
    console.log(`[import-dump] ${file}: ${list.length} ürün`);
    for (const product of list) {
      const stats = await upsertProductTree(product, {
        storageRoot: env.STORAGE_PATH,
        siteDomain: env.SITE_DOMAIN,
        downloadImages: true,
      });
      productsUpserted += stats.products;
      imagesDownloaded += stats.imagesDownloaded;
      if (productsUpserted % 50 === 0) {
        console.log("[import-dump] ilerleme", {
          productsUpserted,
          imagesDownloaded,
        });
      }
    }
  }

  console.log("[import-dump] tamam", {
    categoriesUpsert,
    productsUpserted,
    imagesDownloaded,
  });
}

function flattenCategories(input: unknown): EtkinCategory[] {
  const out: EtkinCategory[] = [];
  const walk = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }
    if (typeof node === "object" && node !== null && "kategori_id" in node) {
      out.push(node as EtkinCategory);
      const rec = node as {
        alt_kategoriler?: unknown;
        altkategoriler?: unknown;
      };
      walk(rec.alt_kategoriler ?? rec.altkategoriler);
    }
  };
  walk(input);
  return out;
}

function normalizeProductList(products: unknown): EtkinProduct[] {
  if (Array.isArray(products)) {
    return products.filter((p) => p && typeof p === "object" && "urun_id" in p);
  }
  if (products && typeof products === "object") {
    return Object.values(products as Record<string, EtkinProduct>).filter(
      (p) => p && typeof p === "object" && "urun_id" in p,
    );
  }
  return [];
}

main()
  .catch((error) => {
    console.error("[import-dump] hata:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
