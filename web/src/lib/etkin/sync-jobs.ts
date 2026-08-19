/**
 * Sync job fonksiyonları — admin API'den tetiklenebilir.
 *
 * Her fonksiyon bir SyncRun kaydı oluşturur, işi yapar, sonucu kaydeder.
 * Mevcut CLI sync.ts bu dosyaya delege edecek şekilde güncellenebilir.
 */

import path from "node:path";
import { mkdir } from "node:fs/promises";
import { prisma } from "../db";
import { getEnv } from "../env";
import { EtkinApiClient } from "./client";
import { upsertCategory, upsertProductTree } from "./catalog";
import type { EtkinCategory, EtkinIndex, EtkinProduct } from "./types";

export type SyncJobType =
  | "full"
  | "categories"
  | "products"
  | "single_product"
  | "stock_prices"
  | "images";

export type SyncProgress = {
  runId: number;
  phase: string;
  done: number;
  total: number;
};

type OnProgress = (p: SyncProgress) => void;

function noop() {}

function makeClient() {
  const env = getEnv();
  return {
    env,
    client: new EtkinApiClient({
      apiUrl: env.API_URL,
      hash: env.API_HASH,
      ebayiEposta: env.EBAYI_EPOSTA,
      siteDomain: env.SITE_DOMAIN,
      requestGapMs: env.SYNC_REQUEST_GAP_MS,
    }),
  };
}

async function ensureStorage(storagePath: string) {
  await mkdir(path.resolve(storagePath), { recursive: true });
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

async function createRun(jobType: string) {
  await cleanStaleRuns();
  return prisma.syncRun.create({
    data: { status: "running", errorMessage: jobType },
  });
}

async function cleanStaleRuns() {
  const STALE_MS = 30 * 60 * 1000;
  const cutoff = new Date(Date.now() - STALE_MS);
  await prisma.syncRun.updateMany({
    where: { status: "running", startedAt: { lt: cutoff } },
    data: { status: "failed", finishedAt: new Date(), errorMessage: "Zaman aşımı (30dk)" },
  });
}

async function finishRun(
  runId: number,
  client: EtkinApiClient,
  stats: { categories: number; products: number; images: number },
  error?: string,
) {
  await prisma.syncRun.update({
    where: { id: runId },
    data: {
      status: error ? "failed" : "success",
      finishedAt: new Date(),
      requestCount: client.getRequestCount(),
      categoriesUpsert: stats.categories,
      productsUpserted: stats.products,
      imagesDownloaded: stats.images,
      errorMessage: error || undefined,
    },
  });
}

// ─── SYNC KATEGORİLER ────────────────────────────────────────────

export async function syncCategories(onProgress: OnProgress = noop) {
  const { env, client } = makeClient();
  await ensureStorage(env.STORAGE_PATH);
  const run = await createRun("categories");
  let categories = 0;

  try {
    onProgress({ runId: run.id, phase: "Kategoriler çekiliyor…", done: 0, total: 0 });
    const cats = await client.query<EtkinCategory[] | { Hata: string }>(
      "tum_kategoriler_hiyerasi",
    );
    if (cats && typeof cats === "object" && "Hata" in cats) {
      throw new Error(`API Hata (kategoriler): ${(cats as { Hata: string }).Hata}`);
    }

    const flat = flattenCategories(cats as EtkinCategory[]);
    for (let i = 0; i < flat.length; i++) {
      await upsertCategory(flat[i], {
        storageRoot: env.STORAGE_PATH,
        siteDomain: env.SITE_DOMAIN,
        downloadImage: true,
      });
      categories += 1;
      onProgress({ runId: run.id, phase: "Kategoriler", done: i + 1, total: flat.length });
    }

    await finishRun(run.id, client, { categories, products: 0, images: 0 });
    return { runId: run.id, categories };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await finishRun(run.id, client, { categories, products: 0, images: 0 }, msg);
    throw error;
  }
}

// ─── SYNC TÜM ÜRÜNLER ───────────────────────────────────────────

export async function syncAllProducts(onProgress: OnProgress = noop) {
  const { env, client } = makeClient();
  await ensureStorage(env.STORAGE_PATH);
  const run = await createRun("products");
  let productsUpserted = 0;
  let imagesDownloaded = 0;

  try {
    onProgress({ runId: run.id, phase: "İndeks çekiliyor…", done: 0, total: 0 });
    const index = await client.query<EtkinIndex>("index");
    if (index.Hata) throw new Error(`API Hata (index): ${index.Hata}`);

    const allIds = (index.urunler ?? []).map((u) => u.urun_id);
    const BATCH = 20;
    const total = allIds.length;

    for (let offset = 0; offset < total; offset += BATCH) {
      const batch = allIds.slice(offset, offset + BATCH);
      onProgress({
        runId: run.id,
        phase: `Ürünler (${Math.min(offset + BATCH, total)}/${total})`,
        done: offset,
        total,
      });

      const products = await client.query<
        EtkinProduct[] | Record<string, EtkinProduct> | { Hata: string }
      >("array_urunler", { array_urunler: batch });

      if (products && typeof products === "object" && "Hata" in products) {
        console.error("[sync] batch hata:", (products as { Hata: string }).Hata);
        continue;
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

    await finishRun(run.id, client, {
      categories: 0,
      products: productsUpserted,
      images: imagesDownloaded,
    });
    return { runId: run.id, productsUpserted, imagesDownloaded };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await finishRun(
      run.id,
      client,
      { categories: 0, products: productsUpserted, images: imagesDownloaded },
      msg,
    );
    throw error;
  }
}

// ─── SYNC FULL (KATEGORİ + ÜRÜN) ────────────────────────────────

export async function syncFull(onProgress: OnProgress = noop) {
  const { env, client } = makeClient();
  await ensureStorage(env.STORAGE_PATH);
  const run = await createRun("full");
  let categoriesUpserted = 0;
  let productsUpserted = 0;
  let imagesDownloaded = 0;

  try {
    // 1. Kategoriler
    onProgress({ runId: run.id, phase: "Kategoriler çekiliyor…", done: 0, total: 0 });
    const cats = await client.query<EtkinCategory[] | { Hata: string }>(
      "tum_kategoriler_hiyerasi",
    );
    if (cats && typeof cats === "object" && "Hata" in cats) {
      throw new Error(`API Hata (kategoriler): ${(cats as { Hata: string }).Hata}`);
    }
    const flat = flattenCategories(cats as EtkinCategory[]);
    for (let i = 0; i < flat.length; i++) {
      await upsertCategory(flat[i], {
        storageRoot: env.STORAGE_PATH,
        siteDomain: env.SITE_DOMAIN,
        downloadImage: true,
      });
      categoriesUpserted += 1;
      onProgress({ runId: run.id, phase: "Kategoriler", done: i + 1, total: flat.length });
    }

    // 2. Ürünler
    onProgress({ runId: run.id, phase: "İndeks çekiliyor…", done: 0, total: 0 });
    const index = await client.query<EtkinIndex>("index");
    if (index.Hata) throw new Error(`API Hata (index): ${index.Hata}`);

    const allIds = (index.urunler ?? []).map((u) => u.urun_id);
    const BATCH = 20;
    const total = allIds.length;

    for (let offset = 0; offset < total; offset += BATCH) {
      const batch = allIds.slice(offset, offset + BATCH);
      onProgress({
        runId: run.id,
        phase: `Ürünler (${Math.min(offset + BATCH, total)}/${total})`,
        done: categoriesUpserted + offset,
        total: categoriesUpserted + total,
      });

      const products = await client.query<
        EtkinProduct[] | Record<string, EtkinProduct> | { Hata: string }
      >("array_urunler", { array_urunler: batch });

      if (products && typeof products === "object" && "Hata" in products) {
        console.error("[sync] batch hata:", (products as { Hata: string }).Hata);
        continue;
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

    await finishRun(run.id, client, {
      categories: categoriesUpserted,
      products: productsUpserted,
      images: imagesDownloaded,
    });
    return { runId: run.id, categoriesUpserted, productsUpserted, imagesDownloaded };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await finishRun(
      run.id,
      client,
      { categories: categoriesUpserted, products: productsUpserted, images: imagesDownloaded },
      msg,
    );
    throw error;
  }
}

// ─── TEKİL ÜRÜN ÇEKME ───────────────────────────────────────────

export async function syncSingleProduct(productId: number) {
  const { env, client } = makeClient();
  await ensureStorage(env.STORAGE_PATH);
  const run = await createRun("single_product");

  try {
    const result = await client.query<EtkinProduct | { Hata: string }>("tekil_urun", {
      tekil_urun: productId,
    });

    if (result && typeof result === "object" && "Hata" in result) {
      throw new Error(`API Hata: ${(result as { Hata: string }).Hata}`);
    }

    const product = result as EtkinProduct;
    if (!product.urun_id) throw new Error("Geçersiz ürün yanıtı");

    const stats = await upsertProductTree(product, {
      storageRoot: env.STORAGE_PATH,
      siteDomain: env.SITE_DOMAIN,
      downloadImages: true,
    });

    await finishRun(run.id, client, {
      categories: 0,
      products: stats.products,
      images: stats.imagesDownloaded,
    });
    return { runId: run.id, ...stats };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await finishRun(run.id, client, { categories: 0, products: 0, images: 0 }, msg);
    throw error;
  }
}

// ─── STOK & FİYAT GÜNCELLEME ────────────────────────────────────

export async function syncStockPrices(onProgress: OnProgress = noop) {
  const { client } = makeClient();
  const run = await createRun("stock_prices");
  let updated = 0;

  try {
    onProgress({ runId: run.id, phase: "Stok ve fiyat çekiliyor…", done: 0, total: 0 });
    const result = await client.query<
      Array<{
        urun_id: number;
        urun_fiyat?: string | number;
        urun_fiyat_virgul?: string;
        fiyat_kdv?: number | string;
        toplam_stok?: number | string;
        mstok?: number | string;
        istok?: number | string;
        tstok?: number | string;
      }> | { Hata: string }
    >("tum_stok_fiyatlar");

    if (result && typeof result === "object" && "Hata" in result) {
      throw new Error(`API Hata: ${(result as { Hata: string }).Hata}`);
    }

    const items = Array.isArray(result) ? result : [];
    const { parseEtkinPrice, toInt } = await import("./types");

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = toInt(item.urun_id);
      if (!id) continue;

      const existing = await prisma.product.findUnique({
        where: { id },
        select: { removed: true, adminLocked: true },
      });
      if (!existing || existing.removed || existing.adminLocked) continue;

      await prisma.product.update({
        where: { id },
        data: {
          price: parseEtkinPrice(item.urun_fiyat ?? item.urun_fiyat_virgul),
          vatRate: toInt(item.fiyat_kdv, 20),
          stockTotal: toInt(item.toplam_stok),
          stockCenter: toInt(item.mstok),
          stockIstanbul: toInt(item.istok),
          stockTopkapi: toInt(item.tstok),
        },
      });
      updated += 1;

      if (i % 100 === 0) {
        onProgress({ runId: run.id, phase: "Stok/Fiyat", done: i, total: items.length });
      }
    }

    await finishRun(run.id, client, { categories: 0, products: updated, images: 0 });
    return { runId: run.id, updated };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await finishRun(run.id, client, { categories: 0, products: updated, images: 0 }, msg);
    throw error;
  }
}
