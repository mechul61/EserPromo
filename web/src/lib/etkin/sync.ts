/**
 * Katalog senkron iskeleti.
 *
 * - Ziyaretçi trafiği API'ye gitmez.
 * - Hotlink yok: görseller storage'a iner.
 * - Yerel IP whitelist değilse bu script WordPress/VPS IP'sinden çalıştırılmalı.
 *
 * Akış:
 *  1) index (MD5 / sayılar)
 *  2) tum_kategoriler_hiyerasi → Category
 *  3) (ileride) değişen ürünler → tum_urunler_varyant / array_*
 *  4) görseller indir
 */

import "dotenv/config";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../db";
import { getEnv } from "../env";
import { EtkinApiClient } from "./client";
import { upsertCategory, upsertProductTree } from "./catalog";
import type { EtkinCategory, EtkinIndex, EtkinProduct } from "./types";

async function main() {
  const env = getEnv();
  await mkdir(path.resolve(env.STORAGE_PATH), { recursive: true });

  const run = await prisma.syncRun.create({
    data: { status: "running" },
  });

  const client = new EtkinApiClient({
    apiUrl: env.API_URL,
    hash: env.API_HASH,
    ebayiEposta: env.EBAYI_EPOSTA,
    siteDomain: env.SITE_DOMAIN,
    requestGapMs: env.SYNC_REQUEST_GAP_MS,
  });

  let categoriesUpsert = 0;
  let productsUpserted = 0;
  let imagesDownloaded = 0;

  try {
    console.log("[sync] index…");
    const index = await client.query<EtkinIndex>("index");
    if (index.Hata) {
      throw new Error(`API Hata (index): ${index.Hata}`);
    }

    console.log("[sync] bağlantı OK", {
      sezon: index.sezonbilgiler,
      kategoriAdet: index.kategoriler?.length ?? 0,
      urunAdet: index.urunler?.length ?? 0,
    });

    console.log("[sync] kategoriler (hiyerarşi)…");
    const cats = await client.query<EtkinCategory[] | { Hata: string }>(
      "tum_kategoriler_hiyerasi",
    );
    if (cats && typeof cats === "object" && "Hata" in cats) {
      throw new Error(`API Hata (kategoriler): ${cats.Hata}`);
    }

    const flatCats = flattenCategories(cats as EtkinCategory[]);
    for (const cat of flatCats) {
      await upsertCategory(cat, {
        storageRoot: env.STORAGE_PATH,
        siteDomain: env.SITE_DOMAIN,
        downloadImage: true,
      });
      categoriesUpsert += 1;
    }

    // İlk kurulum / test: index’ten birkaç ürün (varyant ağacı).
    // Tam katalog sync ayrı job olacak (MD5 diff + batch).
    const sampleIds = (index.urunler ?? []).slice(0, 5).map((u) => u.urun_id);
    if (sampleIds.length) {
      console.log("[sync] örnek ürünler (array_urunler):", sampleIds);
      const products = await client.query<EtkinProduct[] | Record<string, EtkinProduct> | { Hata: string }>(
        "array_urunler",
        { array_urunler: sampleIds },
      );
      if (products && typeof products === "object" && "Hata" in products) {
        throw new Error(`API Hata (urunler): ${(products as { Hata: string }).Hata}`);
      }

      const list = normalizeProductList(products);
      for (const p of list) {
        const stats = await upsertProductTree(p, {
          storageRoot: env.STORAGE_PATH,
          siteDomain: env.SITE_DOMAIN,
          downloadImages: true,
        });
        productsUpserted += stats.products;
        imagesDownloaded += stats.imagesDownloaded;
      }
    }

    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        requestCount: client.getRequestCount(),
        categoriesUpsert,
        productsUpserted,
        imagesDownloaded,
      },
    });

    console.log("[sync] tamam", {
      categoriesUpsert,
      productsUpserted,
      imagesDownloaded,
      requestCount: client.getRequestCount(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        requestCount: client.getRequestCount(),
        categoriesUpsert,
        productsUpserted,
        imagesDownloaded,
        errorMessage: message,
      },
    });
    console.error("[sync] hata:", message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

function flattenCategories(input: EtkinCategory[]): EtkinCategory[] {
  const out: EtkinCategory[] = [];
  const walk = (node: EtkinCategory | EtkinCategory[] | Record<string, unknown>) => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }
    if (typeof node === "object" && "kategori_id" in node) {
      out.push(node as EtkinCategory);
      const children =
        (node as { alt_kategoriler?: EtkinCategory[]; altkategoriler?: EtkinCategory[] })
          .alt_kategoriler ??
        (node as { altkategoriler?: EtkinCategory[] }).altkategoriler;
      if (children) walk(children);
    }
  };
  walk(input);
  return out;
}

function normalizeProductList(
  products: EtkinProduct[] | Record<string, EtkinProduct> | unknown,
): EtkinProduct[] {
  if (Array.isArray(products)) return products;
  if (products && typeof products === "object") {
    return Object.values(products as Record<string, EtkinProduct>).filter(
      (p) => p && typeof p === "object" && "urun_id" in p,
    );
  }
  return [];
}

main();
