import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { CatalogChrome } from "@/components/catalog/CatalogChrome";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { CatalogProductCard } from "@/components/catalog/CatalogProductCard";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { CatalogSort } from "@/components/catalog/CatalogSort";
import { MainNav } from "@/components/layout/MainNav";
import {
  CATALOG_PAGE_SIZE,
  asParamList,
  catalogBreadcrumb,
  catalogTitleForSlug,
  demoNotebooks,
  filterListing,
  isNotebookDemoSlug,
  knownCatalogSlug,
  type ListingProduct,
} from "@/data/catalog-page";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { canonicalPath, categoryPath, productPath } from "@/lib/seo/urls";

type Query = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Query>;
};

const EXTRA_TITLES: Record<string, string> = {
  "yeni-urunler": "Yeni Ürünler",
  "cok-satanlar": "Çok Satanlar",
};

function isKnownSlug(slug: string) {
  return knownCatalogSlug(slug) || slug in EXTRA_TITLES;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = await findCategory(slug);
  const title = category?.name ?? EXTRA_TITLES[slug] ?? catalogTitleForSlug(slug);
  if (!category && !isKnownSlug(slug)) return { title: "Kategori bulunamadı" };
  return {
    title,
    description:
      category?.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
      `${title} promosyon ürünleri.`,
    alternates: { canonical: canonicalPath(categoryPath(slug)) },
  };
}

async function findCategory(slug: string) {
  try {
    return await prisma.category.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

function grossPrice(price: { toString(): string }, vatRate: { toString(): string }) {
  const net = Number(price.toString());
  const vat = Number(vatRate.toString());
  if (!Number.isFinite(net)) return 0;
  return net * (1 + (Number.isFinite(vat) ? vat : 20) / 100);
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const category = await findCategory(slug);

  if (!category && !isKnownSlug(slug)) notFound();

  let products: ListingProduct[] = [];
  let parentName: string | null = null;

  if (category) {
    if (category.parentId) {
      try {
        const parent = await prisma.category.findUnique({
          where: { id: category.parentId },
        });
        parentName = parent?.name ?? null;
      } catch {
        parentName = null;
      }
    }

    try {
      const rows = await prisma.product.findMany({
        where: { categoryId: category.id, isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      });
      products = rows.map((product) => ({
        id: product.id,
        href: productPath(product.slug),
        code: product.sku,
        name: product.title || product.name,
        image: mediaUrl(product.images[0]?.localPath) ?? "/brand/logo.png",
        price: grossPrice(product.price, product.vatRate),
        size: product.size ?? undefined,
        color: product.color ?? undefined,
        stock: product.stockTotal,
        isNew: Date.now() - product.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30,
      }));
    } catch {
      products = [];
    }
  }

  if (products.length === 0 && isNotebookDemoSlug(slug)) {
    products = demoNotebooks();
  }

  const filtered = filterListing(products, {
    renk: asParamList(query.renk),
    ebat: asParamList(query.ebat),
    sira: typeof query.sira === "string" ? query.sira : undefined,
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE));
  const page = Math.min(
    pageCount,
    Math.max(1, Number.parseInt(String(query.page ?? "1"), 10) || 1),
  );
  const pageItems = filtered.slice(
    (page - 1) * CATALOG_PAGE_SIZE,
    page * CATALOG_PAGE_SIZE,
  );

  const title = category?.name ?? EXTRA_TITLES[slug] ?? catalogTitleForSlug(slug);
  const crumbs = category
    ? [
        ...(parentName ? [{ name: parentName, slug: "" }] : []),
        { name: category.name, slug },
      ]
    : catalogBreadcrumb(slug);
  const basePath = categoryPath(slug);
  const sira = typeof query.sira === "string" ? query.sira : "populer";

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
                  {filtered.length} ürün bulundu
                </p>
              </div>
              <Suspense fallback={<div className="h-9 w-[220px]" />}>
                <CatalogSort value={sira} />
              </Suspense>
            </div>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <CatalogFilters basePath={basePath} query={query} />

              <section className="min-w-0 flex-1">
                {pageItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {pageItems.map((product) => (
                      <CatalogProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="border border-[#e6e8ec] bg-white px-6 py-16 text-center text-[14px] text-muted">
                    Bu kategoride henüz ürün yok.
                  </div>
                )}

                <CatalogPagination
                  basePath={basePath}
                  query={query}
                  page={page}
                  pageCount={Math.ceil(filtered.length / CATALOG_PAGE_SIZE)}
                />
              </section>
            </div>
          </div>
        </div>
      </div>
    </CatalogChrome>
  );
}
