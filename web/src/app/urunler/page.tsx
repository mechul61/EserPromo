import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { CatalogChrome } from "@/components/catalog/CatalogChrome";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogInfiniteGrid } from "@/components/catalog/CatalogInfiniteGrid";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { CatalogSort } from "@/components/catalog/CatalogSort";
import { MainNav } from "@/components/layout/MainNav";
import { asParamList } from "@/data/catalog-page";
import { getCatalogListingResult } from "@/lib/catalog-listing-query";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { allProductsPath } from "@/lib/seo/urls";

type Query = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams: Promise<Query>;
};

export const metadata = buildPageMetadata({
  title: "Tüm Ürünler",
  description:
    "Promosyon ve kurumsal hediye ürünlerimizin tamamını keşfedin. Kalem, ajanda, tekstil, teknoloji ürünleri ve daha fazlası.",
  path: allProductsPath(),
});

export default async function AllProductsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const basePath = allProductsPath();
  const scope = { kind: "all" as const };

  const listing = await getCatalogListingResult(scope, {
    renk: asParamList(query.renk),
    ebat: asParamList(query.ebat),
    sira: typeof query.sira === "string" ? query.sira : undefined,
    page: 1,
  });

  const sira = typeof query.sira === "string" ? query.sira : "populer";
  const listingKey = [
    "all",
    ...asParamList(query.renk),
    ...asParamList(query.ebat),
    sira,
  ].join("|");

  return (
    <CatalogChrome>
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4">
        <CatalogSidebar />

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
              <ChevronRight className="size-3" />
              <span className="text-[#555]">Tüm Ürünler</span>
            </nav>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[28px] leading-none font-extrabold tracking-wide text-[#111] uppercase">
                  Tüm Ürünler
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
