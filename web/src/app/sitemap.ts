import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { removed: false }, select: { slug: true, updatedAt: true } }),
    prisma.product.findMany({
      where: { isActive: true, removed: false },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({
      url: `${base}/product-category/${c.slug}/`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${base}/urun/${p.slug}/`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
