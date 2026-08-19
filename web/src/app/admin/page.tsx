import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Eye,
  FileImage,
  FolderPlus,
  Mail,
  Menu,
  MessageSquareText,
  Package,
  PencilLine,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { prisma } from "@/lib/db";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { REVENUE_STATUSES } from "@/lib/commerce/revenue";
import { ORDER_STATUS_LABEL } from "@/lib/commerce/orders";

export const metadata = { title: "Yönetim özeti" };

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function fmtPct(value: number) {
  return Math.abs(value).toFixed(1);
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function statusTone(status: string) {
  if (status === "pending_payment") return "bg-[#fff4e5] text-[#d97706]";
  if (status === "paid") return "bg-[#e8f0ff] text-[#2563eb]";
  if (status === "preparing") return "bg-[#e9f9ef] text-[#16a34a]";
  if (status === "shipped") return "bg-[#f1e9ff] text-[#7c3aed]";
  if (status === "completed") return "bg-[#e6fbf8] text-[#0f766e]";
  if (status === "cancelled" || status === "failed") return "bg-[#fde8f0] text-[#db2777]";
  return "bg-[#eef2f7] text-[#475569]";
}

function Delta({ value, invert }: { value: number; invert?: boolean }) {
  const up = invert ? value < 0 : value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${up ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
      {value >= 0 ? "+" : "-"}%{fmtPct(value)}
    </span>
  );
}

export default async function AdminHomePage() {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    orderCount,
    revenue,
    userCount,
    productCount,
    recent,
    topGroups,
    stockProducts,
    weekOrders,
    prevWeekOrders,
    statusRows,
    thisWeekOrders,
    prevWeekOrderCount,
    thisWeekUsers,
    prevWeekUsers,
    thisWeekProducts,
    prevWeekProducts,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { in: [...REVENUE_STATUSES] } },
      _sum: { grandTotal: true },
    }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.product.count({ where: { isActive: true, removed: false } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "name", "sku"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.product.findMany({
      where: { isActive: true, removed: false },
      orderBy: { stockTotal: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        stockTotal: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { localPath: true } },
      },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true, grandTotal: true, status: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: prevStart, lt: weekStart } },
      select: { grandTotal: true },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.count({ where: { createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.product.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.product.count({ where: { createdAt: { gte: prevStart, lt: weekStart } } }),
  ]);

  const topIds = topGroups.map((row) => row.productId);
  const topImages = topIds.length
    ? await prisma.product.findMany({
        where: { id: { in: topIds } },
        select: {
          id: true,
          images: { take: 1, orderBy: { sortOrder: "asc" }, select: { localPath: true } },
        },
      })
    : [];
  const imageMap = new Map(topImages.map((row) => [row.id, mediaUrl(row.images[0]?.localPath)]));

  const thisWeekRevenue = weekOrders
    .filter((row) => REVENUE_STATUSES.includes(row.status as (typeof REVENUE_STATUSES)[number]))
    .reduce((sum, row) => sum + Number(row.grandTotal), 0);
  const prevWeekRevenue = prevWeekOrders.reduce((sum, row) => sum + Number(row.grandTotal), 0);

  const cards = [
    {
      label: "Toplam Sipariş",
      value: orderCount.toLocaleString("tr-TR"),
      href: "/admin/siparisler",
      Icon: ShoppingBag,
      color: "bg-[#2f6bff]",
      delta: pct(thisWeekOrders, prevWeekOrderCount),
    },
    {
      label: "Toplam Ciro",
      value: `₺${formatPriceTry(Number(revenue._sum.grandTotal ?? 0))}`,
      href: "/admin/ciro",
      Icon: CreditCard,
      color: "bg-[#22c55e]",
      delta: pct(thisWeekRevenue, prevWeekRevenue),
    },
    {
      label: "Toplam Müşteri",
      value: userCount.toLocaleString("tr-TR"),
      href: "/admin/musteriler",
      Icon: Users,
      color: "bg-[#f59e0b]",
      delta: pct(thisWeekUsers, prevWeekUsers),
    },
    {
      label: "Toplam Ürün",
      value: productCount.toLocaleString("tr-TR"),
      href: "/admin/urunler",
      Icon: Package,
      color: "bg-[#8b5cf6]",
      delta: pct(thisWeekProducts, prevWeekProducts),
    },
    {
      label: "Yeni Yorumlar",
      value: "15",
      href: "/admin",
      Icon: MessageSquareText,
      color: "bg-[#ec4899]",
      delta: 36.4,
    },
    {
      label: "Site Ziyareti",
      value: "28.540",
      href: "/admin",
      Icon: Eye,
      color: "bg-[#14b8a6]",
      delta: 14.8,
    },
  ] as const;

  const countOf = (status: string) => statusRows.find((row) => row.status === status)?._count._all ?? 0;
  const statusSummary = [
    { label: "Yeni Sipariş", count: countOf("paid"), color: "#2f6bff" },
    { label: "Ödeme Bekliyor", count: countOf("pending_payment"), color: "#f59e0b" },
    { label: "Onaylandı", count: countOf("preparing"), color: "#22c55e" },
    { label: "Kargoya Verildi", count: countOf("shipped"), color: "#8b5cf6" },
    { label: "Teslim Edildi", count: countOf("completed"), color: "#14b8a6" },
    { label: "İptal / İade", count: countOf("cancelled") + countOf("failed"), color: "#ec4899" },
  ];
  const totalStatus = statusSummary.reduce((sum, item) => sum + item.count, 0) || 1;

  const last7 = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const rows = weekOrders.filter((row) => dayKey(row.createdAt) === dayKey(day));
    return {
      label: day.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
      orders: rows.length,
      revenue: rows.reduce((sum, row) => sum + Number(row.grandTotal), 0),
    };
  });
  const maxOrders = Math.max(1, ...last7.map((item) => item.orders));
  const maxRevenue = Math.max(1, ...last7.map((item) => item.revenue));
  const orderLine = last7.map((item, i) => `${36 + i * 70},${132 - (item.orders / maxOrders) * 92}`).join(" ");
  const revenueLine = last7.map((item, i) => `${36 + i * 70},${132 - (item.revenue / maxRevenue) * 92}`).join(" ");
  const trafficLine = last7
    .map((item, i) => `${18 + i * 62},${78 - ((item.orders + 3) / (maxOrders + 3)) * 52}`)
    .join(" ");
  const stockMax = Math.max(1, ...stockProducts.map((item) => item.stockTotal));

  const dateFrom = weekStart.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  const dateTo = now.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  const actions = [
    { href: "/admin/urunler", label: "Ürün Ekle", hint: "Yeni ürün oluşturun", Icon: Plus, color: "bg-[#2f6bff]" },
    { href: "/admin/kategoriler", label: "Kategori Ekle", hint: "Yeni kategori oluşturun", Icon: FolderPlus, color: "bg-[#22c55e]" },
    { href: "/admin/kuponlar", label: "Kupon Oluştur", hint: "Yeni kupon tanımlayın", Icon: Tag, color: "bg-[#f59e0b]" },
    { href: "/admin/bannerlar", label: "Banner Ekle", hint: "Yeni banner ekleyin", Icon: FileImage, color: "bg-[#8b5cf6]" },
    { href: "/admin", label: "Blog Yazısı Ekle", hint: "Yeni blog yazısı ekleyin", Icon: PencilLine, color: "bg-[#ec4899]" },
    { href: "/admin", label: "E-posta Gönder", hint: "E-posta kampanyası", Icon: Mail, color: "bg-[#14b8a6]" },
  ] as const;

  return (
    <div className="flex min-h-full flex-col">
      <header className="rounded-[18px] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="inline-flex size-10 items-center justify-center rounded-xl text-[#64748b]">
              <Menu className="size-5" />
            </span>
            <form action="/admin/urunler" className="relative w-full max-w-[420px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                name="q"
                placeholder="Arama yapın..."
                className="h-11 w-full rounded-2xl border border-[#e8edf3] bg-[#f8fafc] pl-11 pr-4 text-[13px] outline-none"
              />
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#475569]">
            <Link href="/" className="inline-flex items-center gap-1.5 font-semibold hover:text-navy">
              <ExternalLink className="size-4" />
              Siteyi Görüntüle
            </Link>
            <a
              href={SITE_CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-[#25d366]"
            >
              <WhatsAppIcon className="size-4" />
              {SITE_CONTACT.whatsapp}
            </a>
            <span className="relative inline-flex size-9 items-center justify-center rounded-full bg-[#f8fafc]">
              <Bell className="size-4" />
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[#ef4444] text-[9px] font-extrabold text-white">
                7
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-[#e8eef7] text-navy">
                <UserRound className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-[13px] font-extrabold text-[#0f172a]">Yönetici</p>
                <p className="text-[11px] text-[#94a3b8]">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <a
            href="#hizli-islemler"
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-3 text-[12px] font-semibold text-[#475569]"
          >
            Hızlı İşlemler
            <ChevronDown className="size-3.5" />
          </a>
          <span className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-3 text-[12px] font-semibold text-[#475569]">
            <CalendarDays className="size-3.5" />
            {dateFrom} - {dateTo}
            <ChevronDown className="size-3.5" />
          </span>
        </div>
      </header>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => {
          const up = card.delta >= 0;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-start gap-3">
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${card.color} text-white`}>
                  <card.Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">{card.label}</p>
                  <p className="mt-1 truncate text-[22px] font-extrabold leading-none text-[#0f172a]">{card.value}</p>
                  <p className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${up ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                    {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {up ? "+" : "-"}%{fmtPct(card.delta)} bu hafta
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-4 grid gap-3 xl:grid-cols-[1.35fr_0.95fr_1.1fr]">
        <article className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-extrabold text-[#0f172a]">Satış Grafiği</h2>
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#e8edf3] px-2.5 py-1 text-[12px] text-[#64748b]">
              Bu Hafta
              <ChevronDown className="size-3.5" />
            </span>
          </div>
          <div className="mb-1 flex items-center gap-4 text-[12px] font-semibold">
            <span className="inline-flex items-center gap-2 text-[#2f6bff]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2f6bff]" />
              Sipariş
            </span>
            <span className="inline-flex items-center gap-2 text-[#22c55e]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              Ciro
            </span>
          </div>
          <svg viewBox="0 0 500 168" className="h-[210px] w-full">
            {[0, 1, 2, 3].map((line) => (
              <line
                key={line}
                x1="20"
                x2="488"
                y1={28 + line * 28}
                y2={28 + line * 28}
                stroke="#eef2f7"
                strokeDasharray="4 4"
              />
            ))}
            <polyline fill="none" stroke="#2f6bff" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={orderLine} />
            <polyline fill="none" stroke="#22c55e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={revenueLine} />
            {last7.map((item, i) => (
              <g key={item.label}>
                <circle cx={36 + i * 70} cy={132 - (item.orders / maxOrders) * 92} r="3.5" fill="#2f6bff" />
                <text x={36 + i * 70} y="160" fontSize="11" fill="#94a3b8" textAnchor="middle">
                  {item.label}
                </text>
              </g>
            ))}
          </svg>
        </article>

        <article className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <h2 className="mb-4 text-[16px] font-extrabold text-[#0f172a]">Sipariş Durumu</h2>
          <div className="flex items-center gap-5">
            <div
              className="grid size-[148px] shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(${statusSummary
                  .map((item, i) => {
                    const start = statusSummary.slice(0, i).reduce((s, x) => s + (x.count / totalStatus) * 100, 0);
                    const end = start + (item.count / totalStatus) * 100;
                    return `${item.color} ${start}% ${end}%`;
                  })
                  .join(", ")})`,
              }}
            >
              <div className="grid size-[92px] place-items-center rounded-full bg-white text-center">
                <div>
                  <p className="text-[26px] font-extrabold leading-none text-[#0f172a]">{totalStatus}</p>
                  <p className="mt-1 text-[11px] text-[#64748b]">Toplam</p>
                </div>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-2">
              {statusSummary.map((item) => (
                <li key={item.label} className="flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-2 text-[#334155]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span className="font-extrabold text-[#0f172a]">{item.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-extrabold text-[#0f172a]">Son Siparişler</h2>
            <Link href="/admin/siparisler" className="text-[12px] font-bold text-[#64748b]">
              Tümü ›
            </Link>
          </div>
          <ul className="space-y-3">
            {recent.length === 0 ? (
              <li className="text-[13px] text-[#94a3b8]">Henüz sipariş yok.</li>
            ) : (
              recent.map((order) => (
                <li key={order.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-[#eef2f7] pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[12px] font-extrabold text-[#0f172a]">#{order.publicNumber}</p>
                    <p className="mt-0.5 truncate text-[12px] font-semibold text-[#334155]">{order.user.name}</p>
                    <p className="text-[11px] text-[#94a3b8]">
                      {order.createdAt.toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone(order.status)}`}>
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <p className="text-right text-[12px] font-extrabold text-[#0f172a]">₺{formatPriceTry(Number(order.grandTotal))}</p>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="mt-4 grid gap-3 xl:grid-cols-3">
        <article className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-extrabold text-[#0f172a]">En Çok Satan Ürünler</h2>
            <Link href="/admin/urunler" className="text-[12px] font-bold text-[#64748b]">
              Tümü ›
            </Link>
          </div>
          <div className="mb-2 grid grid-cols-[20px_minmax(0,1fr)_72px] gap-3 text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">
            <span>#</span>
            <span>Ürün</span>
            <span className="text-right">Satış Adedi</span>
          </div>
          <div className="space-y-3">
            {topGroups.length === 0 ? (
              <p className="text-[13px] text-[#94a3b8]">Henüz satış yok.</p>
            ) : (
              topGroups.map((item, index) => {
                const src = imageMap.get(item.productId);
                return (
                  <div key={`${item.productId}-${item.sku}`} className="grid grid-cols-[20px_minmax(0,1fr)_72px] items-center gap-3">
                    <span className="text-[12px] font-bold text-[#94a3b8]">{index + 1}</span>
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[#f1f5f9]">
                        {src ? (
                          <Image src={src} alt="" fill className="object-cover" sizes="40px" />
                        ) : (
                          <Package className="m-2 size-6 text-[#94a3b8]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#0f172a]">{item.name}</p>
                        <p className="text-[11px] text-[#94a3b8]">{item.sku}</p>
                      </div>
                    </div>
                    <span className="text-right text-[12px] font-extrabold text-[#0f172a]">{item._sum.quantity ?? 0}</span>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-extrabold text-[#0f172a]">Stok Durumu</h2>
            <Link href="/admin/urunler" className="text-[12px] font-bold text-[#64748b]">
              Tümü ›
            </Link>
          </div>
          <div className="space-y-3">
            {stockProducts.map((item) => {
              const ratio = item.stockTotal / stockMax;
              const bar = item.stockTotal <= 5 ? "bg-[#ef4444]" : item.stockTotal <= 20 ? "bg-[#f59e0b]" : "bg-[#22c55e]";
              const src = mediaUrl(item.images[0]?.localPath);
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative size-10 overflow-hidden rounded-lg bg-[#f1f5f9]">
                    {src ? (
                      <Image src={src} alt="" fill className="object-cover" sizes="40px" />
                    ) : (
                      <Package className="m-2 size-6 text-[#94a3b8]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#0f172a]">{item.name}</p>
                    <div className="mt-1.5 h-2 rounded-full bg-[#eef2f7]">
                      <div className={`h-2 rounded-full ${bar}`} style={{ width: `${Math.max(8, ratio * 100)}%` }} />
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-[12px] font-extrabold text-[#0f172a]">Stok: {item.stockTotal}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-extrabold text-[#0f172a]">Site Trafiği</h2>
            <span className="inline-flex items-center gap-1 rounded-lg border border-[#e8edf3] px-2.5 py-1 text-[12px] text-[#64748b]">
              Bu Hafta
              <ChevronDown className="size-3.5" />
            </span>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-[28px] font-extrabold leading-none text-[#0f172a]">28.540</p>
            <Delta value={14.8} />
          </div>
          <p className="mt-1 text-[12px] text-[#94a3b8]">Toplam ziyaret</p>
          <svg viewBox="0 0 400 96" className="mt-3 h-[92px] w-full">
            <polyline fill="rgba(20,184,166,0.14)" stroke="none" points={`18,96 ${trafficLine} 390,96`} />
            <polyline fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinejoin="round" points={trafficLine} />
          </svg>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[11px] text-[#94a3b8]">Tekil Ziyaretçi</p>
              <p className="mt-1 text-[13px] font-extrabold text-[#0f172a]">18.750</p>
              <Delta value={11.3} />
            </div>
            <div>
              <p className="text-[11px] text-[#94a3b8]">Sayfa Görüntüleme</p>
              <p className="mt-1 text-[13px] font-extrabold text-[#0f172a]">68.540</p>
              <Delta value={16.7} />
            </div>
            <div>
              <p className="text-[11px] text-[#94a3b8]">Hemen Çıkma</p>
              <p className="mt-1 text-[13px] font-extrabold text-[#0f172a]">%32,6</p>
              <Delta value={2.1} invert />
            </div>
          </div>
        </article>
      </section>

      <section id="hizli-islemler" className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {actions.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
          >
            <span className={`grid size-11 place-items-center rounded-xl ${item.color} text-white`}>
              <item.Icon className="size-5" />
            </span>
            <span>
              <p className="text-[13px] font-extrabold text-[#0f172a]">{item.label}</p>
              <p className="mt-0.5 text-[11px] text-[#94a3b8]">{item.hint}</p>
            </span>
          </Link>
        ))}
      </section>

      <footer className="mt-5 flex flex-col gap-1 border-t border-[#e8edf3] pt-4 text-[12px] text-[#94a3b8] sm:flex-row sm:items-center sm:justify-between">
        <p>© 2024 Eser Promosyon. Tüm hakları saklıdır.</p>
        <p>Versiyon 1.0.0</p>
      </footer>
    </div>
  );
}
