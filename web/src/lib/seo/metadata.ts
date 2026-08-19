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
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noindex?: boolean;
}): Metadata {
  const canonical = abs(path);
  const imageUrl = image ? (image.startsWith("http") ? image : `${siteUrl()}${image}`) : `${siteUrl()}${DEFAULT_OG_IMAGE}`;
  const desc = trimDescription(description);
  return {
    title,
    description: desc,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: false } : undefined,
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
