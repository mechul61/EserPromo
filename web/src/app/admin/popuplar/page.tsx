import { PopupsPageView } from "@/components/admin/PopupsPageView";
import type { PopupKpi, PopupMonthStats, PopupRow, PopupSettings } from "@/components/admin/popup-types";
import { conversionRate, getPopupSettings, popupImageUrl, popupStatus } from "@/lib/commerce/popups";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Popup Yönetimi | Yönetim" };

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default async function AdminPopupsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const start = new Date("2026-06-01T00:00:00.000Z");
  const end = new Date("2026-08-31T23:59:59.000Z");
  const plannedStart = new Date("2026-09-01T00:00:00.000Z");

  let popups = await prisma.popup.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  if (popups.length === 0) {
    await prisma.popup.createMany({
      data: [
        { title: "%10 İndirim", description: "E-bülten kaydı ile ilk alışverişte geçerli.", kind: "subscribe", placement: "home", audience: "all", isActive: true, heading: "%10 İNDİRİM", body: "E-posta adresinizi bırakın, ilk siparişinize özel kupon kazanın.", ctaLabel: "Abone Ol", couponCode: "HOSGELDIN10", startsAt: start, endsAt: end, views: 18420, clicks: 3120, conversions: 860, sortOrder: 1 },
        { title: "Yaz Kampanyası", description: "Seçili ürünlerde sezon indirimi.", kind: "promo", placement: "all", audience: "all", isActive: true, heading: "Yaz İndirimi", body: "Promosyon ürünlerinde %20’ye varan fırsatlar.", ctaLabel: "Ürünleri Gör", ctaHref: "/urunler", startsAt: start, endsAt: end, views: 12680, clicks: 1980, conversions: 410, sortOrder: 2 },
        { title: "Ücretsiz Kargo", description: "Belirli tutarın üzerindeki siparişlerde.", kind: "info", placement: "cart", audience: "all", isActive: true, heading: "Kargo Bizden", body: "1500 TL ve üzeri siparişlerde kargo ücretsiz.", ctaLabel: "Alışverişe Devam", ctaHref: "/urunler", startsAt: start, endsAt: end, views: 7420, clicks: 980, conversions: 190, sortOrder: 3 },
        { title: "Kurumsal Teklif", description: "Toplu siparişler için özel fiyat.", kind: "info", placement: "category", audience: "returning", isActive: true, heading: "Kurumsal Çözümler", body: "Toplu alımlarda size özel teklif hazırlayalım.", ctaLabel: "İletişime Geç", ctaHref: "/iletisim", startsAt: start, endsAt: end, views: 3180, clicks: 420, conversions: 54, sortOrder: 4, device: "desktop" },
        { title: "Sonbahar Lansmanı", description: "Eylül ayında yayınlanacak kampanya.", kind: "promo", placement: "home", audience: "new_visitors", isActive: true, heading: "Yeni Sezon", body: "Sonbahar koleksiyonu yakında yayında.", ctaLabel: "Haberdar Ol", startsAt: plannedStart, endsAt: new Date("2026-10-31T23:59:59.000Z"), views: 0, clicks: 0, conversions: 0, sortOrder: 5 },
        { title: "Eski Banner Popup", description: "Yayından kaldırıldı.", kind: "promo", placement: "all", isActive: false, heading: "Kampanya Bitti", body: "Bu popup artık gösterilmiyor.", ctaLabel: "Kapat", startsAt: start, endsAt: end, views: 2100, clicks: 140, conversions: 12, sortOrder: 6 },
        { title: "Taslak Abonelik", description: "Metin henüz onaylanmadı.", kind: "subscribe", placement: "home", isDraft: true, isActive: false, heading: "Bülten", body: "Taslak metin.", ctaLabel: "Abone Ol", views: 0, clicks: 0, conversions: 0, sortOrder: 7 },
      ],
    });
    popups = await prisma.popup.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });
  }

  const rows: PopupRow[] = popups.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind,
    placement: row.placement,
    device: row.device,
    audience: row.audience,
    status: popupStatus(row, now),
    isDraft: row.isDraft,
    isActive: row.isActive,
    image: popupImageUrl(row.imagePath),
    imagePath: row.imagePath,
    heading: row.heading,
    body: row.body,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    couponCode: row.couponCode,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    views: row.views,
    clicks: row.clicks,
    conversions: row.conversions,
    delaySeconds: row.delaySeconds,
    frequencyHours: row.frequencyHours,
    sortOrder: row.sortOrder,
  }));

  const counts = {
    total: rows.length,
    active: rows.filter((row) => row.status === "active").length,
    planned: rows.filter((row) => row.status === "planned").length,
    passive: rows.filter((row) => row.status === "passive").length,
    draft: rows.filter((row) => row.status === "draft").length,
  };

  const [monthViews, prevViews, monthClicks, prevClicks, monthConv, prevConv, monthSubs] = await Promise.all([
    prisma.popup.aggregate({ _sum: { views: true }, where: { createdAt: { gte: monthStart } } }),
    prisma.popup.aggregate({ _sum: { views: true }, where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    prisma.popup.aggregate({ _sum: { clicks: true }, where: { createdAt: { gte: monthStart } } }),
    prisma.popup.aggregate({ _sum: { clicks: true }, where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    prisma.popup.aggregate({ _sum: { conversions: true }, where: { createdAt: { gte: monthStart } } }),
    prisma.popup.aggregate({ _sum: { conversions: true }, where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    prisma.popupSubscriber.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  const views = rows.reduce((sum, row) => sum + row.views, 0);
  const kpis: PopupKpi[] = [
    { label: "Toplam Popup", value: counts.total.toLocaleString("tr-TR"), hint: `${counts.draft} taslak`, color: "bg-[#7c3aed]", icon: "total" },
    { label: "Aktif", value: counts.active.toLocaleString("tr-TR"), hint: "Yayında", color: "bg-[#22c55e]", icon: "active" },
    { label: "Planlanan", value: counts.planned.toLocaleString("tr-TR"), hint: "Tarihi bekliyor", color: "bg-[#f59e0b]", icon: "planned" },
    { label: "Pasif", value: counts.passive.toLocaleString("tr-TR"), hint: "Yayında değil", color: "bg-[#ef4444]", icon: "passive" },
    {
      label: "Toplam Görüntüleme",
      value: views.toLocaleString("tr-TR"),
      delta: pct(Number(monthViews._sum.views ?? 0), Number(prevViews._sum.views ?? 0)),
      color: "bg-[#ec4899]",
      icon: "views",
    },
  ];

  const monthStats: PopupMonthStats = {
    views: Number(monthViews._sum.views ?? 0),
    clicks: Number(monthClicks._sum.clicks ?? 0),
    conversions: Number(monthConv._sum.conversions ?? 0),
    subscribers: monthSubs,
    viewsDelta: pct(Number(monthViews._sum.views ?? 0), Number(prevViews._sum.views ?? 0)),
    clicksDelta: pct(Number(monthClicks._sum.clicks ?? 0), Number(prevClicks._sum.clicks ?? 0)),
    conversionsDelta: pct(Number(monthConv._sum.conversions ?? 0), Number(prevConv._sum.conversions ?? 0)),
  };

  const settings: PopupSettings = await getPopupSettings();
  const rate = conversionRate(views, rows.reduce((sum, row) => sum + row.conversions, 0));

  return <PopupsPageView popups={rows} kpis={kpis} monthStats={monthStats} settings={settings} overallRate={rate} />;
}
