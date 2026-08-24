import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";

const DEFAULT_OG_IMAGE = "/brand/logo.png";

function trimDescription(input: string) {
  const clean = input.replace(/\s+/g, " ").trim();
  if (clean.length <= 160) return clean;
  return `${clean.slice(0, 157)}...`;
}

function abs(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withSlash = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return `${siteUrl()}${withSlash}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  noindex,
  nofollow,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
  nofollow?: boolean;
}): Metadata {
  const canonical = abs(path);
  const imageUrl = image ? (image.startsWith("http") ? image : `${siteUrl()}${image}`) : `${siteUrl()}${DEFAULT_OG_IMAGE}`;
  const desc = trimDescription(description);
  return {
    title,
    description: desc,
    alternates: { canonical },
    robots: noindex
      ? { index: false, follow: nofollow === true ? false : true }
      : undefined,
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: canonical,
      title,
      description: desc,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [imageUrl],
    },
  };
}

const LEGACY_CATALOG_QUERY_KEYS = [
  "product_per_page",
  "orderby",
  "product_count",
  "add-to-cart",
  "add_to_wishlist",
  "_wpnonce",
  "removed_item",
  "wc-ajax",
  "query_type",
  /** Eski WordPress post/page ID (?p=135042, ?page_id=...) */
  "p",
  "page_id",
] as const;

/** Eski WooCommerce / filtre query parametreleri (middleware ile de temizlenir). */
export function isLegacyCatalogQueryKey(key: string) {
  return (
    (LEGACY_CATALOG_QUERY_KEYS as readonly string[]).includes(key) ||
    key.startsWith("filter_") ||
    key.startsWith("pa_")
  );
}

/** Filtre / sıralama query’li katalog URL’leri indekslenmemeli (canonical temiz path’te kalır). */
export function catalogQueryNeedsNoindex(query: Record<string, string | string[] | undefined>) {
  const has = (key: string) => {
    const value = query[key];
    if (value == null) return false;
    if (Array.isArray(value)) return value.some((item) => String(item).trim() !== "");
    return String(value).trim() !== "";
  };
  if (has("renk") || has("ebat") || has("sira") || has("page") || has("q")) return true;
  return Object.keys(query).some(isLegacyCatalogQueryKey);
}
