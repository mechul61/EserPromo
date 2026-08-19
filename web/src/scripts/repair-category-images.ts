/**
 * Eksik kategori görsellerini indirir veya alt kategori / ürün görselinden üretir.
 *
 *   npm run repair:category-images
 *   npm run repair:category-images -- --all
 */

import "dotenv/config";
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { categoryIdsWithChildren } from "../lib/catalog";
import { prisma } from "../lib/db";
import { categoryImageFileExists } from "../lib/category-image";
import { downloadToStorage } from "../lib/etkin/images";
import { getEnv } from "../lib/env";

function extFromUrl(url: string): string {
  const m = url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

async function firstChildCategoryImage(categoryId: number) {
  const child = await prisma.category.findFirst({
    where: { parentId: categoryId, removed: false, imageLocalPath: { not: null } },
    orderBy: [{ homepageOrder: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { imageLocalPath: true },
  });
  if (!child?.imageLocalPath) return null;
  if (!(await categoryImageFileExists(child.imageLocalPath))) return null;
  return child.imageLocalPath;
}

async function firstProductImageInTree(categoryId: number) {
  const ids = await categoryIdsWithChildren(categoryId);
  const image = await prisma.productImage.findFirst({
    where: {
      product: {
        categoryId: { in: ids },
        removed: false,
        isActive: true,
      },
    },
    orderBy: [
      { product: { isGroupPrimary: "desc" } },
      { product: { sortOrder: "asc" } },
      { sortOrder: "asc" },
    ],
    select: { localPath: true },
  });
  if (!image?.localPath) return null;
  if (!(await categoryImageFileExists(image.localPath))) return null;
  return image.localPath;
}

async function copyToCategoryImage(
  storageRoot: string,
  categoryId: number,
  sourceRelativePath: string,
) {
  const ext = path.extname(sourceRelativePath) || ".jpg";
  const relativeDir = path.join("categories", String(categoryId));
  const fileName = `home${ext}`;
  const targetRelative = path.join(relativeDir, fileName).replace(/\\/g, "/");
  const sourceAbsolute = path.join(storageRoot, sourceRelativePath);
  const targetAbsolute = path.join(storageRoot, relativeDir, fileName);
  await mkdir(path.dirname(targetAbsolute), { recursive: true });
  await copyFile(sourceAbsolute, targetAbsolute);
  return targetRelative;
}

async function main() {
  const env = getEnv();
  const storageRoot = path.resolve(env.STORAGE_PATH);
  const all = process.argv.includes("--all");

  const categories = await prisma.category.findMany({
    where: all ? { removed: false } : { showOnHomepage: true, removed: false },
    orderBy: [{ homepageOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, imageLocalPath: true, imageUrl: true },
  });

  let repaired = 0;
  let skipped = 0;
  let failed = 0;

  for (const cat of categories) {
    if (cat.imageLocalPath && (await categoryImageFileExists(cat.imageLocalPath))) {
      skipped += 1;
      continue;
    }

    let nextPath: string | null = null;

    if (cat.imageUrl) {
      const ext = extFromUrl(cat.imageUrl);
      const dl = await downloadToStorage({
        url: cat.imageUrl,
        storageRoot,
        relativeDir: path.join("categories", String(cat.id)),
        fileName: `home${ext}`,
        userAgent: env.SITE_DOMAIN,
      });
      if (dl.ok) nextPath = dl.localPath;
    }

    if (!nextPath) {
      const fallback =
        (await firstChildCategoryImage(cat.id)) ?? (await firstProductImageInTree(cat.id));
      if (fallback) {
        nextPath = await copyToCategoryImage(storageRoot, cat.id, fallback);
      }
    }

    if (!nextPath) {
      console.warn(`[repair] görsel bulunamadı: ${cat.id} ${cat.name}`);
      failed += 1;
      continue;
    }

    await prisma.category.update({
      where: { id: cat.id },
      data: { imageLocalPath: nextPath },
    });
    console.log(`[repair] ${cat.id} ${cat.name} -> ${nextPath}`);
    repaired += 1;
  }

  console.log("[repair] tamam", { total: categories.length, repaired, skipped, failed });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
