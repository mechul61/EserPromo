import { BannersPageView } from "@/components/admin/BannersPageView";
import type { BannerKpi, BannerRow, BannerShare } from "@/components/admin/banner-types";
import { BANNER_PLACEMENT_LABEL } from "@/components/admin/banner-types";
import { bannerImageUrl } from "@/lib/commerce/banners";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banner / Slider | Yönetim" };

const PLACE_COLORS: Record<string, string> = {
  hero: "#2f6bff",
  middle_1: "#8b5cf6",
  middle_2: "#f59e0b",
  bottom: "#ec4899",
  side: "#14b8a6",
  category: "#22c55e",
};

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default async function AdminBannersPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let banners = await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  if (banners.length === 0) {
    const start = new Date("2026-06-01T00:00:00.000Z");
    const end = new Date("2026-08-31T23:59:59.000Z");
    await prisma.banner.createMany({
      data: [
        { kind: "banner", title: "Yaz Kampanyası 2024", href: "/urunler", imagePath: "/brand/hero-slide-1.jpg", width: 1920, height: 600, placement: "hero", isActive: true, startsAt: start, endsAt: end, views: 12450, sortOrder: 1 },
        { kind: "banner", title: "Yaz İndirimi", href: "/urunler", imagePath: "/brand/hero-products.jpg", width: 1200, height: 400, placement: "middle_1", isActive: true, startsAt: start, endsAt: end, views: 8320, sortOrder: 2 },
        { kind: "banner", title: "Yeni Sezon Koleksiyonu", href: "/urunler", imagePath: "/brand/hero-main.jpg", width: 1200, height: 400, placement: "middle_2", isActive: true, startsAt: start, endsAt: end, views: 6540, sortOrder: 3 },
        { kind: "banner", title: "Ücretsiz Kargo Kampanyası", href: "/urunler", imagePath: "/brand/feature-truck.png", width: 1920, height: 300, placement: "bottom", isActive: true, startsAt: start, endsAt: end, views: 4180, sortOrder: 4 },
        { kind: "banner", title: "Kurumsal Çözümler", href: "/urunler", imagePath: "/brand/hero-main.jpg", width: 1920, height: 600, placement: "hero", isActive: false, startsAt: start, endsAt: end, views: 2100, sortOrder: 5 },
        { kind: "slider", title: "Ana Slider 1", href: "/urunler", imagePath: "/brand/hero-slide-1.jpg", width: 1920, height: 600, placement: "hero", isActive: true, startsAt: start, endsAt: end, views: 15200, sortOrder: 1 },
        { kind: "slider", title: "Ana Slider 2", href: "/urunler", imagePath: "/brand/hero-main.jpg", width: 1920, height: 600, placement: "hero", isActive: false, startsAt: start, endsAt: end, views: 9800, sortOrder: 2 },
      ],
    });
    banners = await prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  }

  const [monthActive, prevActive, monthPassive, prevPassive, monthViews, prevViews] = await Promise.all([
    prisma.banner.count({ where: { isActive: true, createdAt: { gte: monthStart } } }),
    prisma.banner.count({ where: { isActive: true, createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    prisma.banner.count({ where: { isActive: false, createdAt: { gte: monthStart } } }),
    prisma.banner.count({ where: { isActive: false, createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    prisma.banner.aggregate({ _sum: { views: true }, where: { createdAt: { gte: monthStart } } }),
    prisma.banner.aggregate({ _sum: { views: true }, where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
  ]);

  const rows: BannerRow[] = banners.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    href: row.href,
    image: bannerImageUrl(row.imagePath),
    imagePath: row.imagePath,
    width: row.width,
    height: row.height,
    placement: row.placement,
    isActive: row.isActive,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    minAmount: Number(row.minAmount),
    maxAmount: Number(row.maxAmount),
    views: row.views,
    sortOrder: row.sortOrder,
  }));

  const active = rows.filter((row) => row.isActive).length;
  const placements = new Set(rows.map((row) => row.placement)).size;
  const views = rows.reduce((sum, row) => sum + row.views, 0);

  const kpis: BannerKpi[] = [
    { label: "Toplam Banner", value: rows.length.toLocaleString("tr-TR"), color: "bg-[#2f6bff]", icon: "total" },
    { label: "Aktif Banner", value: active.toLocaleString("tr-TR"), delta: pct(monthActive, prevActive), color: "bg-[#22c55e]", icon: "active" },
    { label: "Pasif Banner", value: (rows.length - active).toLocaleString("tr-TR"), delta: pct(monthPassive, prevPassive), color: "bg-[#f59e0b]", icon: "passive" },
    { label: "Konum Sayısı", value: String(placements), color: "bg-[#7c3aed]", icon: "places" },
    {
      label: "Görüntülenme",
      value: views.toLocaleString("tr-TR"),
      delta: pct(Number(monthViews._sum.views ?? 0), Number(prevViews._sum.views ?? 0)),
      color: "bg-[#ec4899]",
      icon: "views",
    },
  ];

  const placeCounts = (Object.keys(BANNER_PLACEMENT_LABEL) as Array<keyof typeof BANNER_PLACEMENT_LABEL>).map((id) => ({
    id,
    name: BANNER_PLACEMENT_LABEL[id],
    count: rows.filter((row) => row.placement === id).length,
    color: PLACE_COLORS[id] ?? "#2f6bff",
  }));
  const total = Math.max(1, placeCounts.reduce((sum, item) => sum + item.count, 0));
  const shares: BannerShare[] = placeCounts.map((item) => ({ ...item, percent: Math.round((item.count / total) * 100) }));

  return <BannersPageView banners={rows} kpis={kpis} shares={shares} />;
}
