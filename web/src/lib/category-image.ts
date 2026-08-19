import { stat } from "node:fs/promises";
import path from "node:path";
import { categoryIdsWithChildren } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media";

function storageRoot() {
  return path.resolve(process.cwd(), process.env.STORAGE_PATH || "./storage");
}

export async function categoryImageFileExists(localPath: string | null | undefined) {
  if (!localPath) return false;
  try {
    const info = await stat(path.join(storageRoot(), localPath));
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
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

/** Vitrin için kullanılacak görsel yolu (local storage). */
export async function resolveCategoryImagePath(
  categoryId: number,
  imageLocalPath?: string | null,
): Promise<string | null> {
  if (imageLocalPath && (await categoryImageFileExists(imageLocalPath))) {
    return imageLocalPath;
  }

  const childPath = await firstChildCategoryImage(categoryId);
  if (childPath) return childPath;

  return firstProductImageInTree(categoryId);
}

export async function resolveCategoryImageSrc(
  categoryId: number,
  imageLocalPath?: string | null,
): Promise<string> {
  const resolved = await resolveCategoryImagePath(categoryId, imageLocalPath);
  return mediaUrl(resolved) ?? "/brand/logo.png";
}
