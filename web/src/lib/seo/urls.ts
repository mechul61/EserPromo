import { siteUrl } from "../env";

/** Canlı WP ile aynı path'ler (trailing slash Next trailingSlash ile gelir). */
export function categoryPath(slug: string): string {
  return `/product-category/${slug}`;
}

export function productPath(slug: string): string {
  return `/urun/${slug}`;
}

export function canonicalPath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const withSlash = p.endsWith("/") ? p : `${p}/`;
  return `${siteUrl()}${withSlash}`;
}

/** @deprecated productPath kullanın */
export function productCanonicalPath(slug: string): string {
  return productPath(slug);
}

export function variantHref(slug: string): string {
  return productPath(slug);
}
