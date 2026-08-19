import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { LOCAL_AREAS } from "@/lib/seo/local-areas";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPages = [
    "/",
    "/urunler/",
    "/hakkimizda/",
    "/kurumsal/",
    "/baski-teknikleri/",
    "/iletisim/",
    "/bayilik/",
    "/kariyer/",
    "/sss/",
    "/kargo-teslimat/",
    "/iade-degisim/",
    "/odeme-yontemleri/",
    "/gizlilik/",
    "/kullanim-sartlari/",
    "/kvkk/",
    "/site-haritasi/",
    "/teklif/",
    "/logolu-siparis/",
    "/arama/",
    ...LOCAL_AREAS.map((area) => `/bolgeler/${area.slug}/`),
  ];
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ where: { removed: false }, select: { slug: true, updatedAt: true } }),
    prisma.product.findMany({
      where: { isActive: true, removed: false },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    ...staticPages.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: path === "/" ? ("daily" as const) : ("monthly" as const),
      priority: path === "/" ? 1 : 0.5,
    })),
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
