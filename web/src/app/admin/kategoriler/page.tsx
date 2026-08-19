import { CategoriesPageView, type CategoryKpi, type CategoryRow, type CategoryShare } from "@/components/admin/CategoriesPageView";
import { findDuplicateCategories } from "@/lib/admin/category-duplicates";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kategoriler | Yönetim" };

const CHART_COLORS = ["#2f6bff", "#8b5cf6", "#f59e0b", "#22c55e", "#ec4899", "#14b8a6"];

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default async function AdminCategoriesPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [categories, productTotal, monthCreated, prevMonthCreated] = await Promise.all([
    prisma.category.findMany({
      where: { removed: false },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { products: { where: { removed: false } } } },
      },
    }),
    prisma.product.count({ where: { removed: false } }),
    prisma.category.count({ where: { removed: false, createdAt: { gte: monthStart } } }),
    prisma.category.count({
      where: { removed: false, createdAt: { gte: prevMonthStart, lt: monthStart } },
    }),
  ]);

  const nameById = new Map(categories.map((row) => [row.id, row.name]));
  const rows: CategoryRow[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parentId: category.parentId,
    parentName: category.parentId ? nameById.get(category.parentId) ?? null : null,
    productCount: category._count.products,
    showOnHomepage: category.showOnHomepage,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
  }));

  const active = rows.filter((row) => row.showOnHomepage).length;
  const passive = rows.length - active;
  const roots = rows.filter((row) => !row.parentId);
  const shares: CategoryShare[] = roots
    .map((root) => {
      const count = 1 + rows.filter((row) => row.parentId === root.id).length;
      return { id: root.id, name: root.name, count, percent: 0, color: "" };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((item, index) => ({
      ...item,
      percent: rows.length > 0 ? Math.round((item.count / rows.length) * 100) : 0,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));

  const kpis: CategoryKpi[] = [
    {
      label: "Toplam Kategori",
      value: rows.length.toLocaleString("tr-TR"),
      delta: pct(monthCreated, prevMonthCreated),
      color: "bg-[#2f6bff]",
      icon: "total",
    },
    {
      label: "Aktif Kategori",
      value: active.toLocaleString("tr-TR"),
      delta: pct(monthCreated, prevMonthCreated),
      color: "bg-[#22c55e]",
      icon: "active",
    },
    {
      label: "Pasif Kategori",
      value: passive.toLocaleString("tr-TR"),
      delta: -Math.abs(pct(passive, Math.max(1, active))),
      color: "bg-[#f59e0b]",
      icon: "passive",
    },
    {
      label: "Kategori & Ürün",
      value: productTotal.toLocaleString("tr-TR"),
      hint: "Toplam ürün",
      color: "bg-[#8b5cf6]",
      icon: "products",
    },
  ];

  const recent = [...rows]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const duplicateGroups = findDuplicateCategories(rows);

  return (
    <CategoriesPageView
      categories={rows}
      duplicateGroups={duplicateGroups}
      kpis={kpis}
      shares={shares}
      recent={recent}
      productTotal={productTotal}
    />
  );
}
