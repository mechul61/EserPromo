import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
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
          "/siparislerim",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
