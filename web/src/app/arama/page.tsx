import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, Home, Search } from "lucide-react";
import { CatalogChrome } from "@/components/catalog/CatalogChrome";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogInfiniteGrid } from "@/components/catalog/CatalogInfiniteGrid";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { CatalogSort } from "@/components/catalog/CatalogSort";
import { SearchPageHero } from "@/components/search/SearchPageHero";
import { asParamList } from "@/data/catalog-page";
import { getCatalogListingResult } from "@/lib/catalog-listing-query";
import { normalizeSearchQuery } from "@/lib/product-search";

type Query = Record<string, string | string[] | undefined>;

export const metadata = {
  title: "Gelişmiş Arama",
  robots: { index: false, follow: true },
};

const BASE_PATH = "/arama/";

function filtersClearHref(query: string) {
  return query ? `${BASE_PATH}?q=${encodeURIComponent(query)}` : BASE_PATH;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const queryParams = await searchParams;
  const query = normalizeSearchQuery(typeof queryParams.q === "string" ? queryParams.q : "");
  const sira = typeof queryParams.sira === "string" ? queryParams.sira : "populer";

  const scope = query ? ({ kind: "search" as const, q: query }) : null;
  const listing = scope
    ? await getCatalogListingResult(scope, {
        renk: asParamList(queryParams.renk),
        ebat: asParamList(queryParams.ebat),
        sira,
        page: 1,
      })
    : null;

  const listingKey = scope
    ? ["search", query, ...asParamList(queryParams.renk), ...asParamList(queryParams.ebat), sira].join("|")
    : "empty";

  return (
    <CatalogChrome searchQuery={query}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4">
        <CatalogSidebar heading="KATEGORİLER" />

        <div className="min-w-0 flex-1">
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
              <span className="text-[#555]">Arama</span>
            </nav>

            <SearchPageHero query={query} />

            {!query ? (
              <div className="rounded-md border border-[#e6e8ec] bg-white px-6 py-10 text-center">
                <Search className="mx-auto size-10 text-[#c5cad1]" strokeWidth={1.5} />
                <p className="mt-4 text-[15px] font-bold text-[#111]">Aramaya başlayın</p>
                <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-[#8b919a]">
                  Üstteki kutuya ürün adı, stok kodu veya kategori yazın. Sonuçlarda renk ve ebat filtreleri,
                  sıralama ve sonsuz kaydırma ile katalog deneyiminin aynısını kullanabilirsiniz.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {["bursa", "kalem", "ajanda", "termos"].map((term) => (
                    <Link
                      key={term}
                      href={`${BASE_PATH}?q=${encodeURIComponent(term)}`}
                      className="rounded-full border border-[#d5d8de] px-3.5 py-1.5 text-[12px] font-semibold text-[#555] hover:border-navy hover:text-navy"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-[#8b919a]">
                      “<span className="font-semibold text-[#111]">{query}</span>” için{" "}
                      <span className="font-semibold text-navy">{listing!.total.toLocaleString("tr-TR")}</span> ürün
                      bulundu
                    </p>
                  </div>
                  <Suspense fallback={<div className="h-9 w-[220px]" />}>
                    <CatalogSort value={sira} />
                  </Suspense>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                  <CatalogFilters
                    basePath={BASE_PATH}
                    query={queryParams}
                    colors={listing!.colors}
                    sizes={listing!.sizes}
                    clearHref={filtersClearHref(query)}
                  />

                  <section className="min-w-0 flex-1">
                    <Suspense fallback={<div className="min-h-[320px]" />}>
                      <CatalogInfiniteGrid
                        key={listingKey}
                        initialItems={listing!.pageItems}
                        initialPage={listing!.page}
                        pageCount={listing!.pageCount}
                        total={listing!.total}
                        scope={scope!}
                        emptyMessage="Aramanızla eşleşen ürün bulunamadı. Farklı bir kelime deneyin veya filtreleri temizleyin."
                      />
                    </Suspense>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </CatalogChrome>
  );
}
