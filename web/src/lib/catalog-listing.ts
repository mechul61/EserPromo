import type { ListingProduct } from "@/data/catalog-page";
import { mediaUrl } from "@/lib/media";
import { productPath } from "@/lib/seo/urls";

type ProductRow = {
  id: number;
  slug: string;
  sku: string;
  title: string | null;
  name: string;
  price: { toString(): string };
  vatRate: { toString(): string };
  size: string | null;
  color: string | null;
  stockTotal: number;
  skuGroup: string;
  isGroupPrimary: boolean;
  createdAt: Date;
  images: Array<{ localPath: string | null }>;
};

export function mapProductsToListing(rows: ProductRow[], now = Date.now()): ListingProduct[] {
  return rows.map((product) => ({
    id: product.id,
    href: productPath(product.slug),
    code: product.sku,
    name: product.title || product.name,
    image: mediaUrl(product.images[0]?.localPath) ?? "/brand/logo.png",
    price: Number(product.price),
    size: product.size ?? undefined,
    color: product.color ?? undefined,
    stock: product.stockTotal,
    skuGroup: product.skuGroup,
    isGroupPrimary: product.isGroupPrimary,
    isNew: now - product.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30,
  }));
}

/** Varyantları skuGroup başına tek kartta gösterir. */
export function groupListingBySkuGroup(products: ListingProduct[]): ListingProduct[] {
  const grouped = new Map<string, ListingProduct>();
  for (const p of products) {
    const existing = grouped.get(p.skuGroup);
    if (!existing) {
      grouped.set(p.skuGroup, p);
      continue;
    }

    const existingInStock = existing.stock > 0;
    const pInStock = p.stock > 0;
    if (pInStock && !existingInStock) {
      grouped.set(p.skuGroup, p);
      continue;
    }
    if (!existingInStock && !pInStock) {
      if (p.isGroupPrimary && !existing.isGroupPrimary) grouped.set(p.skuGroup, p);
      continue;
    }
    if (existingInStock && pInStock && p.isGroupPrimary && !existing.isGroupPrimary) {
      grouped.set(p.skuGroup, p);
    }
  }
  return [...grouped.values()];
}

export const catalogProductInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
} as const;
