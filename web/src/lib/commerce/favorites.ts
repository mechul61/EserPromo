import { prisma } from "../db";
import { getCurrentUser } from "../auth/session";
import { mediaUrl } from "../media";
import { grossPrice } from "../product-detail";
import { productPath } from "../seo/urls";
import type { ListingProduct } from "@/data/catalog-page";

const favoriteProductInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
};

export function toListingProduct(product: {
  id: number;
  slug: string;
  sku: string;
  name: string;
  title: string | null;
  size: string | null;
  color: string | null;
  stockTotal: number;
  price: { toString(): string };
  vatRate: { toString(): string };
  createdAt: Date;
  images: Array<{ localPath: string }>;
}): ListingProduct {
  return {
    id: product.id,
    href: productPath(product.slug),
    code: product.sku,
    name: product.title || product.name,
    image: mediaUrl(product.images[0]?.localPath) ?? "/brand/logo.png",
    price: grossPrice(Number(product.price), Number(product.vatRate)),
    size: product.size ?? undefined,
    color: product.color ?? undefined,
    skuGroup: "",
    isGroupPrimary: true,
    stock: product.stockTotal,
    isNew: Date.now() - product.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30,
  };
}

export async function listFavoriteIds(userId: string): Promise<number[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    select: { productId: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => row.productId);
}

export async function listFavoriteProducts(userId: string): Promise<ListingProduct[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId, product: { isActive: true, removed: false } },
    include: { product: { include: favoriteProductInclude } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => toListingProduct(row.product));
}

export async function peekFavoriteCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return prisma.favorite.count({ where: { userId: user.id } });
}

export async function toggleFavorite(userId: string, productId: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, removed: false },
    select: { id: true },
  });
  if (!product) {
    throw new Error("Ürün bulunamadı");
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { favorited: false as const };
  }

  await prisma.favorite.create({ data: { userId, productId } });
  return { favorited: true as const };
}

export async function mergeFavoriteIds(userId: string, productIds: number[]) {
  const unique = [...new Set(productIds)].filter((id) => Number.isInteger(id) && id > 0).slice(0, 100);
  if (unique.length === 0) return listFavoriteIds(userId);

  const products = await prisma.product.findMany({
    where: { id: { in: unique }, isActive: true, removed: false },
    select: { id: true },
  });
  const valid = new Set(products.map((p) => p.id));

  await prisma.$transaction(
    unique
      .filter((id) => valid.has(id))
      .map((productId) =>
        prisma.favorite.upsert({
          where: { userId_productId: { userId, productId } },
          create: { userId, productId },
          update: {},
        }),
      ),
  );

  return listFavoriteIds(userId);
}
