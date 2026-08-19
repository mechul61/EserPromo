import { ProductsPageView, type CategoryShare, type ProductRow, type ProductsKpi } from "@/components/admin/ProductsPageView";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ürünler | Yönetim" };

const CHART_COLORS = ["#2f6bff", "#8b5cf6", "#f59e0b", "#22c55e", "#ec4899", "#14b8a6"];

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default async function AdminProductsPage() {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const live = { removed: false as const };

  const [
    products,
    categories,
    total,
    active,
    inStock,
    outStock,
    lowStock,
    weekCreated,
    prevWeekCreated,
    weekActive,
    prevWeekActive,
    weekInStock,
    prevWeekInStock,
    weekOut,
    prevWeekOut,
    weekLow,
    prevWeekLow,
    categoryRows,
    variantGroups,
  ] = await Promise.all([
    prisma.product.findMany({
      where: live,
      orderBy: { name: "asc" },
      take: 2500,
      select: {
        id: true,
        name: true,
        title: true,
        sku: true,
        skuGroup: true,
        color: true,
        size: true,
        price: true,
        vatRate: true,
        stockTotal: true,
        categoryId: true,
        isActive: true,
        showOnHomepage: true,
        isGroupPrimary: true,
        slug: true,
        category: { select: { name: true } },
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { localPath: true } },
      },
    }),
    prisma.category.findMany({
      where: { removed: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.product.count({ where: live }),
    prisma.product.count({ where: { ...live, isActive: true } }),
    prisma.product.count({ where: { ...live, stockTotal: { gt: 0 } } }),
    prisma.product.count({ where: { ...live, stockTotal: 0 } }),
    prisma.product.count({ where: { ...live, stockTotal: { gt: 0, lte: 20 } } }),
    prisma.product.count({ where: { ...live, createdAt: { gte: weekStart } } }),
    prisma.product.count({ where: { ...live, createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.product.count({ where: { ...live, isActive: true, createdAt: { gte: weekStart } } }),
    prisma.product.count({ where: { ...live, isActive: true, createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.product.count({ where: { ...live, stockTotal: { gt: 0 }, createdAt: { gte: weekStart } } }),
    prisma.product.count({ where: { ...live, stockTotal: { gt: 0 }, createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.product.count({ where: { ...live, stockTotal: 0, createdAt: { gte: weekStart } } }),
    prisma.product.count({ where: { ...live, stockTotal: 0, createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.product.count({ where: { ...live, stockTotal: { gt: 0, lte: 20 }, createdAt: { gte: weekStart } } }),
    prisma.product.count({ where: { ...live, stockTotal: { gt: 0, lte: 20 }, createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.product.groupBy({
      by: ["categoryId"],
      where: live,
      _count: { _all: true },
      orderBy: { _count: { categoryId: "desc" } },
      take: 5,
    }),
    prisma.product.groupBy({
      by: ["skuGroup"],
      where: live,
      _count: { _all: true },
    }),
  ]);

  const variantCountMap = new Map(variantGroups.map((row) => [row.skuGroup, row._count._all]));
  const categoryNameMap = new Map(categories.map((row) => [row.id, row.name]));

  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    title: product.title,
    sku: product.sku,
    skuGroup: product.skuGroup,
    color: product.color,
    size: product.size,
    price: Number(product.price),
    vatRate: Number(product.vatRate),
    stockTotal: product.stockTotal,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    isActive: product.isActive,
    showOnHomepage: product.showOnHomepage,
    isGroupPrimary: product.isGroupPrimary,
    slug: product.slug,
    image: product.images[0]?.localPath ?? null,
    brand: "Eser Promo",
    variantCount: variantCountMap.get(product.skuGroup) ?? 1,
  }));

  const kpis: ProductsKpi[] = [
    {
      label: "Toplam Ürün",
      value: total.toLocaleString("tr-TR"),
      delta: pct(weekCreated, prevWeekCreated),
      color: "bg-[#2f6bff]",
      icon: "total",
    },
    {
      label: "Aktif Ürün",
      value: active.toLocaleString("tr-TR"),
      delta: pct(weekActive, prevWeekActive),
      color: "bg-[#22c55e]",
      icon: "active",
    },
    {
      label: "Stokta Olan",
      value: inStock.toLocaleString("tr-TR"),
      delta: pct(weekInStock, prevWeekInStock),
      color: "bg-[#f59e0b]",
      icon: "inStock",
    },
    {
      label: "Stokta Olmayan",
      value: outStock.toLocaleString("tr-TR"),
      delta: -Math.abs(pct(weekOut, prevWeekOut)),
      color: "bg-[#8b5cf6]",
      icon: "outStock",
    },
    {
      label: "Düşük Stok",
      value: lowStock.toLocaleString("tr-TR"),
      delta: -Math.abs(pct(weekLow, prevWeekLow)),
      color: "bg-[#ec4899]",
      icon: "lowStock",
    },
  ];

  const categoryShares: CategoryShare[] = categoryRows.map((row, index) => ({
    id: row.categoryId,
    name: categoryNameMap.get(row.categoryId) ?? `Kategori ${row.categoryId}`,
    count: row._count._all,
    percent: total > 0 ? Math.round((row._count._all / total) * 100) : 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <ProductsPageView
      products={rows}
      categories={categories}
      kpis={kpis}
      categoryShares={categoryShares}
      lowStockCount={lowStock}
    />
  );
}
