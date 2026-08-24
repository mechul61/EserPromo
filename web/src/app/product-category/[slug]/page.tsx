import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { CatalogChrome } from "@/components/catalog/CatalogChrome";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogInfiniteGrid } from "@/components/catalog/CatalogInfiniteGrid";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { CatalogSort } from "@/components/catalog/CatalogSort";
import { MainNav } from "@/components/layout/MainNav";
import {
  asParamList,
  catalogBreadcrumb,
  catalogTitleForSlug,
  knownCatalogSlug,
} from "@/data/catalog-page";
import { resolveCategory } from "@/lib/catalog";
import { getCatalogListingResult } from "@/lib/catalog-listing-query";
import { prisma } from "@/lib/db";
import { buildPageMetadata, catalogQueryNeedsNoindex } from "@/lib/seo/metadata";
import { categoryPath } from "@/lib/seo/urls";

type Query = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Query>;
};

const EXTRA_TITLES: Record<string, string> = {
  "yeni-urunler": "Yeni Ürünler",
  "cok-satanlar": "Çok Satanlar",
  kampanyali: "Kampanyalı Ürünler",
};

function isKnownSlug(slug: string) {
  return knownCatalogSlug(slug) || slug in EXTRA_TITLES;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await findCategory(slug);
  const title = category?.name ?? EXTRA_TITLES[slug] ?? catalogTitleForSlug(slug);
  if (!category && !isKnownSlug(slug)) return { title: "Kategori bulunamadı" };
  const description =
    category?.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
    `${title} promosyon ürünleri.`;
  return buildPageMetadata({
    title,
    description,
    path: categoryPath(slug),
    noindex: catalogQueryNeedsNoindex(query),
  });
}

async function findCategory(slug: string) {
  try {
    return await resolveCategory(slug);
  } catch {
    return null;
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await findCategory(slug);

  if (!category && !isKnownSlug(slug)) notFound();

  let parentName: string | null = null;

  if (category?.parentId) {
    try {
      const parent = await prisma.category.findUnique({
        where: { id: category.parentId },
      });
      parentName = parent?.name ?? null;
    } catch {
      parentName = null;
    }
  }

  const scope = { kind: "category" as const, slug };
  const listing = await getCatalogListingResult(scope, {
    renk: asParamList(query.renk),
    ebat: asParamList(query.ebat),
    sira: typeof query.sira === "string" ? query.sira : undefined,
    page: 1,
  });

  const title = category?.name ?? EXTRA_TITLES[slug] ?? catalogTitleForSlug(slug);
  const crumbs = category
    ? [
        ...(parentName ? [{ name: parentName, slug: "" }] : []),
        { name: category.name, slug },
      ]
    : catalogBreadcrumb(slug);
  const basePath = categoryPath(slug);
  const sira = typeof query.sira === "string" ? query.sira : "populer";
  const listingKey = [
    slug,
    ...asParamList(query.renk),
    ...asParamList(query.ebat),
    sira,
  ].join("|");

  return (
    <CatalogChrome>
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4">
        <CatalogSidebar activeSlug={slug} />

        <div className="min-w-0 flex-1">
          <MainNav />

          <div className="pt-4">
            <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
              <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
                <Home className="size-3.5" />
              </Link>
              <ChevronRight className="size-3" />
              <Link href="/" className="hover:text-navy">
                Ana Sayfa
              </Link>
              {crumbs.map((crumb, index) => (
                <span key={`${crumb.slug}-${crumb.name}`} className="contents">
                  <ChevronRight className="size-3" />
                  {index === crumbs.length - 1 || !crumb.slug ? (
                    <span className="text-[#555]">{crumb.name}</span>
                  ) : (
                    <Link href={categoryPath(crumb.slug)} className="hover:text-navy">
                      {crumb.name}
                    </Link>
                  )}
                </span>
              ))}
            </nav>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[28px] leading-none font-extrabold tracking-wide text-[#111] uppercase">
                  {title}
                </h1>
                <p className="mt-2 text-[13px] text-[#8b919a]">
                  {listing.total} ürün bulundu
                </p>
              </div>
              <Suspense fallback={<div className="h-9 w-[220px]" />}>
                <CatalogSort value={sira} />
              </Suspense>
            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <CatalogFilters
                basePath={basePath}
                query={query}
                colors={listing.colors}
                sizes={listing.sizes}
              />

              <section className="min-w-0 flex-1">
                <Suspense fallback={<div className="min-h-[320px]" />}>
                  <CatalogInfiniteGrid
                    key={listingKey}
                    initialItems={listing.pageItems}
                    initialPage={listing.page}
                    pageCount={listing.pageCount}
                    total={listing.total}
                    scope={scope}
                    emptyMessage="Bu kategoride henüz ürün yok."
                  />
                </Suspense>
              </section>
            </div>
          </div>
        </div>
      </div>
    </CatalogChrome>
  );
}
