import { cache } from "react";
import type { Prisma } from "@prisma/client";
import {
  CATALOG_PAGE_SIZE,
  filterKey,
  type FilterOption,
  type ListingProduct,
} from "@/data/catalog-page";
import { categoryIdsWithChildren, resolveCategory } from "@/lib/catalog";
import { catalogProductInclude, mapProductsToListing } from "@/lib/catalog-listing";
import { prisma } from "@/lib/db";

export type CatalogListingScope = { kind: "all" } | { kind: "category"; slug: string };

export type CatalogListingFilters = {
  renk?: string[];
  ebat?: string[];
  sira?: string;
  page?: number;
};

type ScopeConfig = {
  baseWhere: Prisma.ProductWhereInput;
  maxTotal?: number;
};

const SPECIAL_SLUGS = new Set(["yeni-urunler", "cok-satanlar", "kampanyali"]);

function currentTimestamp() {
  return Date.now();
}

const resolveScopeConfig = cache(async (scope: CatalogListingScope): Promise<ScopeConfig | null> => {
  const active = { isActive: true, removed: false };

  if (scope.kind === "all") {
    return { baseWhere: active };
  }

  const slug = scope.slug;
  if (SPECIAL_SLUGS.has(slug)) {
    return {
      baseWhere: {
        ...active,
        isGroupPrimary: true,
        ...(slug === "kampanyali" ? { discountLocked: true } : {}),
      },
      maxTotal: 48,
    };
  }

  const category = await resolveCategory(slug).catch(() => null);
  if (!category) return null;

  const categoryIds = await categoryIdsWithChildren(category.id);
  return { baseWhere: { ...active, categoryId: { in: categoryIds } } };
});

function buildListingOrderBy(
  sira: string | undefined,
  scope: CatalogListingScope,
): Prisma.ProductOrderByWithRelationInput[] {
  const inStockFirst: Prisma.ProductOrderByWithRelationInput = { stockTotal: "desc" };

  switch (sira) {
    case "fiyat-artan":
      return [inStockFirst, { price: "asc" }, { id: "asc" }];
    case "fiyat-azalan":
      return [inStockFirst, { price: "desc" }, { id: "asc" }];
    case "yeni":
      return [inStockFirst, { createdAt: "desc" }, { id: "desc" }];
    case "ad":
      return [inStockFirst, { name: "asc" }, { id: "asc" }];
    default:
      if (scope.kind === "category" && scope.slug === "yeni-urunler") {
        return [inStockFirst, { createdAt: "desc" }, { id: "desc" }];
      }
      if (scope.kind === "category" && scope.slug === "cok-satanlar") {
        return [inStockFirst, { id: "desc" }];
      }
      return [inStockFirst, { sortOrder: "asc" }, { id: "asc" }];
  }
}

async function resolveMatchingSkuGroups(
  baseWhere: Prisma.ProductWhereInput,
  filters: Pick<CatalogListingFilters, "renk" | "ebat">,
): Promise<string[] | undefined> {
  const { renk, ebat } = filters;
  if (!renk?.length && !ebat?.length) return undefined;

  let colorLabels: string[] | undefined;
  if (renk?.length) {
    const rows = await prisma.product.findMany({
      where: { ...baseWhere, color: { not: null } },
      select: { color: true },
      distinct: ["color"],
    });
    colorLabels = rows.map((row) => row.color!).filter((color) => renk.includes(filterKey(color)));
    if (colorLabels.length === 0) return [];
  }

  const groups = await prisma.product.findMany({
    where: {
      ...baseWhere,
      ...(colorLabels?.length ? { color: { in: colorLabels } } : {}),
      ...(ebat?.length ? { size: { in: ebat } } : {}),
    },
    select: { skuGroup: true },
    distinct: ["skuGroup"],
  });

  return groups.map((group) => group.skuGroup);
}

function buildListingWhere(
  baseWhere: Prisma.ProductWhereInput,
  skuGroups: string[] | undefined,
): Prisma.ProductWhereInput {
  return {
    ...baseWhere,
    isGroupPrimary: true,
    ...(skuGroups !== undefined ? { skuGroup: { in: skuGroups } } : {}),
  };
}

export async function getCatalogFilterOptions(scope: CatalogListingScope): Promise<{
  colors: FilterOption[];
  sizes: FilterOption[];
}> {
  const config = await resolveScopeConfig(scope);
  if (!config) return { colors: [], sizes: [] };

  const [colorGroups, sizeGroups] = await Promise.all([
    prisma.product.groupBy({
      by: ["color"],
      where: { ...config.baseWhere, color: { not: null } },
      _count: { _all: true },
    }),
    prisma.product.groupBy({
      by: ["size"],
      where: { ...config.baseWhere, size: { not: null } },
      _count: { _all: true },
    }),
  ]);

  return {
    colors: colorGroups
      .map((row) => ({
        key: filterKey(row.color!),
        label: row.color!,
        count: row._count._all,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr")),
    sizes: sizeGroups
      .map((row) => ({
        key: row.size!,
        label: row.size!,
        count: row._count._all,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr")),
  };
}

export async function getCatalogListingResult(
  scope: CatalogListingScope,
  filters: CatalogListingFilters,
) {
  const config = await resolveScopeConfig(scope);
  if (!config) {
    return {
      pageItems: [] as ListingProduct[],
      pageCount: 1,
      total: 0,
      page: 1,
      colors: [] as FilterOption[],
      sizes: [] as FilterOption[],
    };
  }

  const skuGroups = await resolveMatchingSkuGroups(config.baseWhere, filters);
  if (skuGroups?.length === 0) {
    const filterOptions = await getCatalogFilterOptions(scope);
    return {
      pageItems: [],
      pageCount: 1,
      total: 0,
      page: 1,
      colors: filterOptions.colors,
      sizes: filterOptions.sizes,
    };
  }

  const listingWhere = buildListingWhere(config.baseWhere, skuGroups);
  const page = Math.max(1, filters.page ?? 1);
  const skip = (page - 1) * CATALOG_PAGE_SIZE;

  const [rawTotal, rows, filterOptions] = await Promise.all([
    prisma.product.count({ where: listingWhere }),
    prisma.product.findMany({
      where: listingWhere,
      include: catalogProductInclude,
      orderBy: buildListingOrderBy(filters.sira, scope),
      skip,
      take: CATALOG_PAGE_SIZE,
    }),
    page === 1 ? getCatalogFilterOptions(scope) : Promise.resolve(null),
  ]);

  const total =
    config.maxTotal !== undefined ? Math.min(rawTotal, config.maxTotal) : rawTotal;
  const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const now = currentTimestamp();

  let pageItems = mapProductsToListing(rows, now);

  if (config.maxTotal !== undefined && skip + pageItems.length > config.maxTotal) {
    pageItems = pageItems.slice(0, Math.max(0, config.maxTotal - skip));
  }

  const colors = filterOptions?.colors ?? [];
  const sizes = filterOptions?.sizes ?? [];

  return {
    pageItems,
    pageCount,
    total,
    page: safePage,
    colors,
    sizes,
  };
}

export function parseCatalogListingScope(scopeParam: string | null): CatalogListingScope | null {
  if (!scopeParam || scopeParam === "all") return { kind: "all" };
  if (scopeParam.length > 0 && scopeParam.length < 200) {
    return { kind: "category", slug: scopeParam };
  }
  return null;
}
