import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { getSiteSettings } from "@/lib/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = siteUrl();
  const settings = await getSiteSettings();
  if (!settings.seo.allowIndexing) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: `${base}/sitemap.xml`,
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/hesabim",
          "/giris",
          "/kayit",
          "/sepet",
          "/odeme",
          "/siparislerim",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
