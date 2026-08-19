"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  Menu,
  MessageSquareText,
  MoreVertical,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { formatPriceTry } from "@/lib/media";
import { downloadCsv } from "@/lib/admin/csv";

export type OrdersKpiIcon = "orders" | "revenue" | "customers" | "products" | "comments" | "visits";

export type OrdersKpiCard = {
  label: string;
  value: string;
  delta: number;
  color: string;
  icon: OrdersKpiIcon;
};

const KPI_ICONS = {
  orders: ShoppingBag,
  revenue: CreditCard,
  customers: Users,
  products: Package,
  comments: MessageSquareText,
  visits: Eye,
} as const;

export type AdminOrderRow = {
  id: string;
  publicNumber: string;
  customer: string;
  email: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  createdAt: string;
};

type TabId = "all" | "new" | "pending" | "approved" | "shipped" | "completed" | "cancelled";

const PAGE_SIZES = [10, 25, 50] as const;

const ORDER_STATUS_LABEL: Record<string, string> = {
  paid: "Onaylandı",
  pending_payment: "Ödeme Bekliyor",
  preparing: "Onaylandı",
  shipped: "Kargoya Verildi",
  completed: "Teslim Edildi",
  cancelled: "İptal / İade",
  failed: "İptal / İade",
  draft: "Taslak",
};

const PAYMENT_LABEL: Record<string, string> = {
  success: "Ödendi",
  pending: "Ödeme Bekliyor",
  failure: "Ödeme Başarısız",
  refunded: "İade Edildi",
};

const AVATAR_COLORS = ["#2f6bff", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#ef4444"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function orderStatusTone(status: string) {
  if (status === "pending_payment") return "bg-[#fff4e5] text-[#d97706]";
  if (status === "paid" || status === "preparing") return "bg-[#e9f9ef] text-[#16a34a]";
  if (status === "shipped") return "bg-[#e8f0ff] text-[#2563eb]";
  if (status === "completed") return "bg-[#e6fbf8] text-[#0f766e]";
  if (status === "cancelled" || status === "failed") return "bg-[#fde8f0] text-[#db2777]";
  return "bg-[#eef2f7] text-[#475569]";
}

function paymentTone(status: string) {
  if (status === "success") return "bg-[#e9f9ef] text-[#16a34a]";
  if (status === "pending") return "bg-[#fff4e5] text-[#d97706]";
  if (status === "refunded" || status === "failure") return "bg-[#fde8f0] text-[#db2777]";
  return "bg-[#eef2f7] text-[#475569]";
}

function cargoLabel(status: string) {
  if (status === "shipped" || status === "completed") return "Kargoya Verildi";
  return "Kargo Bekliyor";
}

function cargoTone(status: string) {
  if (status === "shipped" || status === "completed") return "text-[#2563eb] font-semibold";
  return "text-[#94a3b8]";
}

function tabFilter(tab: TabId, row: AdminOrderRow) {
  if (tab === "all") return true;
  if (tab === "new") return row.status === "paid";
  if (tab === "pending") return row.status === "pending_payment";
  if (tab === "approved") return row.status === "preparing";
  if (tab === "shipped") return row.status === "shipped";
  if (tab === "completed") return row.status === "completed";
  return row.status === "cancelled" || row.status === "failed";
}

function fmtDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtPct(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

export function OrdersPageView({
  orders,
  kpis,
  tabCounts,
}: {
  orders: AdminOrderRow[];
  kpis: OrdersKpiCard[];
  tabCounts: Record<TabId, number>;
}) {
  const [tab, setTab] = useState<TabId>("all");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [cargoStatus, setCargoStatus] = useState("all");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(draftQuery);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftQuery]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minTotal ? Number(minTotal.replace(",", ".")) : null;
    const max = maxTotal ? Number(maxTotal.replace(",", ".")) : null;
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return orders
      .filter((row) => tabFilter(tab, row))
      .filter((row) => {
        if (!q) return true;
        return (
          row.publicNumber.toLowerCase().includes(q) ||
          row.customer.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q)
        );
      })
      .filter((row) => (orderStatus === "all" ? true : row.status === orderStatus))
      .filter((row) => (paymentStatus === "all" ? true : row.paymentStatus === paymentStatus))
      .filter((row) => {
        if (cargoStatus === "all") return true;
        if (cargoStatus === "shipped") return row.status === "shipped" || row.status === "completed";
        return row.status !== "shipped" && row.status !== "completed";
      })
      .filter((row) => (min == null || Number.isNaN(min) || row.grandTotal >= min) && (max == null || Number.isNaN(max) || row.grandTotal <= max))
      .filter((row) => {
        const created = new Date(row.createdAt).getTime();
        if (from && created < from.getTime()) return false;
        if (to && created > to.getTime()) return false;
        return true;
      })
      .sort((a, b) => {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDesc ? -diff : diff;
      });
  }, [orders, tab, query, orderStatus, paymentStatus, cargoStatus, minTotal, maxTotal, dateFrom, dateTo, sortDesc]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "all", label: "Tüm Siparişler" },
    { id: "new", label: "Yeni Siparişler" },
    { id: "pending", label: "Ödeme Bekleyen" },
    { id: "approved", label: "Onaylanan" },
    { id: "shipped", label: "Kargoya Verilen" },
    { id: "completed", label: "Teslim Edilen" },
    { id: "cancelled", label: "İptal / İade" },
  ];

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        pageRows.forEach((row) => next.delete(row.id));
        return next;
      });
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      pageRows.forEach((row) => next.add(row.id));
      return next;
    });
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setOrderStatus("all");
    setPaymentStatus("all");
    setCargoStatus("all");
    setMinTotal("");
    setMaxTotal("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setNotice("Filtreler temizlendi.");
  }

  function exportCsv() {
    const source = selected.size ? filtered.filter((row) => selected.has(row.id)) : filtered;
    downloadCsv(
      "siparisler.csv",
      ["no", "customer", "email", "status", "payment", "total", "createdAt"],
      source.map((row) => [row.publicNumber, row.customer, row.email, row.status, row.paymentStatus, row.grandTotal, row.createdAt]),
    );
    setNotice(`${source.length} sipariş dışa aktarıldı.`);
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="rounded-[18px] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="inline-flex size-10 items-center justify-center rounded-xl text-[#64748b]">
              <Menu className="size-5" />
            </span>
            <div className="relative w-full max-w-[420px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder="Arama yapın..."
                className="h-11 w-full rounded-2xl border border-[#e8edf3] bg-[#f8fafc] pl-11 pr-4 text-[13px] outline-none"
              />
            </div>
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
      </header>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Siparişler</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">
            <Link href="/admin" className="hover:text-navy">
              Ana Sayfa
            </Link>
            <span className="mx-1.5">›</span>
            <span className="text-[#64748b]">Siparişler</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-4 text-[13px] font-semibold text-[#475569]"
          >
            <Download className="size-4" />
            Dışa Aktar
          </button>
        </div>
      </div>
      {notice ? <p className="mt-3 text-[13px] font-semibold text-[#2563eb]">{notice}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {kpis.map((card) => {
          const up = card.delta >= 0;
          const Icon = KPI_ICONS[card.icon];
          return (
            <div key={card.label} className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${card.color} text-white`}>
                  <Icon className="size-5" />
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
            </div>
          );
        })}
      </div>

      <section className="mt-4 rounded-xl border border-[#edf1f6] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block min-w-0 sm:col-span-2 lg:col-span-2">
            <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
            <div className="relative">
              <input
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder="Sipariş No, Müşteri, E-posta ara..."
                className="h-11 w-full rounded-lg border border-[#dbe3ee] bg-white px-3 pr-10 text-[13px] text-[#334155] placeholder:text-[#94a3b8] outline-none"
              />
              <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            </div>
          </label>
          <label className="block min-w-0 sm:col-span-2 lg:col-span-2">
            <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Tarih Aralığı</span>
            <div className="flex min-w-0 items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="h-11 min-w-0 flex-1 rounded-lg border border-[#dbe3ee] bg-white px-2 text-[12px] text-[#334155] outline-none"
              />
              <span className="shrink-0 text-[#94a3b8]">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="h-11 min-w-0 flex-1 rounded-lg border border-[#dbe3ee] bg-white px-2 text-[12px] text-[#334155] outline-none"
              />
            </div>
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Sipariş Durumu</span>
            <div className="relative">
              <select
                value={orderStatus}
                onChange={(e) => {
                  setOrderStatus(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none"
              >
                <option value="all">Tümü</option>
                <option value="paid">Onaylandı</option>
                <option value="pending_payment">Ödeme Bekliyor</option>
                <option value="preparing">Hazırlanıyor</option>
                <option value="shipped">Kargoya Verildi</option>
                <option value="completed">Teslim Edildi</option>
                <option value="cancelled">İptal / İade</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            </div>
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Ödeme Durumu</span>
            <div className="relative">
              <select
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none"
              >
                <option value="all">Tümü</option>
                <option value="success">Ödendi</option>
                <option value="pending">Ödeme Bekliyor</option>
                <option value="refunded">İade Edildi</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            </div>
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Kargo Durumu</span>
            <div className="relative">
              <select
                value={cargoStatus}
                onChange={(e) => {
                  setCargoStatus(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none"
              >
                <option value="all">Tümü</option>
                <option value="waiting">Kargo Bekliyor</option>
                <option value="shipped">Kargoya Verildi</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            </div>
          </label>
          <div className="block min-w-0">
            <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Toplam Tutar</span>
            <div className="flex items-center gap-1.5">
              <div className="relative min-w-0 flex-1">
                <input
                  value={minTotal}
                  onChange={(e) => {
                    setMinTotal(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Min"
                  className="h-11 w-full rounded-lg border border-[#dbe3ee] bg-white px-3 pr-7 text-[13px] text-[#334155] placeholder:text-[#94a3b8] outline-none"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[#94a3b8]">₺</span>
              </div>
              <span className="shrink-0 text-[13px] text-[#94a3b8]">-</span>
              <div className="relative min-w-0 flex-1">
                <input
                  value={maxTotal}
                  onChange={(e) => {
                    setMaxTotal(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Max"
                  className="h-11 w-full rounded-lg border border-[#dbe3ee] bg-white px-3 pr-7 text-[13px] text-[#334155] placeholder:text-[#94a3b8] outline-none"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[#94a3b8]">₺</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-4 text-[13px] font-medium text-[#475569]"
          >
            <RotateCcw className="size-4" />
            Temizle
          </button>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto border-b border-[#e8edf3]">
          <div className="flex min-w-max items-end gap-8 px-6">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setPage(1);
                  }}
                  className={`-mb-px whitespace-nowrap border-b-[3px] pb-3 pt-4 text-[14px] ${
                    active
                      ? "border-[#2f6bff] font-bold text-[#2f6bff]"
                      : "border-transparent font-medium text-[#64748b] hover:text-[#334155]"
                  }`}
                >
                  {item.label} ({tabCounts[item.id].toLocaleString("tr-TR")})
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-[13px]">
            <thead className="border-b border-[#eef2f7] bg-[#fafbfc] text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th className="w-10 px-2 py-3">#</th>
                <th className="px-3 py-3">Sipariş No</th>
                <th className="px-3 py-3">Müşteri</th>
                <th className="px-3 py-3">
                  <button type="button" onClick={() => setSortDesc((v) => !v)} className="inline-flex items-center gap-1">
                    Tarih
                    <ChevronDown className={`size-3.5 transition ${sortDesc ? "" : "rotate-180"}`} />
                  </button>
                </th>
                <th className="px-3 py-3">Toplam Tutar</th>
                <th className="px-3 py-3">Ödeme</th>
                <th className="px-3 py-3">Kargo</th>
                <th className="px-3 py-3">Durum</th>
                <th className="px-3 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#94a3b8]">
                    Sipariş bulunamadı.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, index) => (
                  <tr key={row.id} className="border-b border-[#eef2f7] last:border-0 hover:bg-[#fafbfc]">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(row.id)) next.delete(row.id);
                            else next.add(row.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="px-2 py-3 text-[#94a3b8]">{start + index + 1}</td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/siparisler/${row.publicNumber}`} className="font-extrabold text-[#2f6bff]">
                        #{row.publicNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="grid size-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white"
                          style={{ background: avatarColor(row.customer) }}
                        >
                          {initials(row.customer)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#0f172a]">{row.customer}</p>
                          <p className="truncate text-[12px] text-[#94a3b8]">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-[#475569]">{fmtDateTime(row.createdAt)}</td>
                    <td className="px-3 py-3 font-extrabold text-[#0f172a]">₺{formatPriceTry(row.grandTotal)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${paymentTone(row.paymentStatus)}`}>
                        {PAYMENT_LABEL[row.paymentStatus] ?? "Ödeme Bekliyor"}
                      </span>
                    </td>
                    <td className={`px-3 py-3 text-[12px] ${cargoTone(row.status)}`}>{cargoLabel(row.status)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${orderStatusTone(row.status)}`}>
                        {ORDER_STATUS_LABEL[row.status] ?? row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/siparisler/${row.publicNumber}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
                        >
                          <Eye className="size-4" />
                        </Link>
                        <button
                          type="button"
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#eef2f7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-[#94a3b8]">
            {filtered.length.toLocaleString("tr-TR")} kayıttan{" "}
            {filtered.length === 0 ? 0 : start + 1} - {Math.min(start + pageSize, filtered.length)} arası gösteriliyor
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8edf3] disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`inline-flex size-8 items-center justify-center rounded-lg text-[12px] font-bold ${
                    currentPage === n ? "bg-[#2f6bff] text-white" : "border border-[#e8edf3] text-[#475569]"
                  }`}
                >
                  {n}
                </button>
              );
            })}
            {pageCount > 5 ? <span className="px-1 text-[#94a3b8]">...</span> : null}
            {pageCount > 5 ? (
              <button
                type="button"
                onClick={() => setPage(pageCount)}
                className={`inline-flex size-8 items-center justify-center rounded-lg text-[12px] font-bold ${
                  currentPage === pageCount ? "bg-[#2f6bff] text-white" : "border border-[#e8edf3] text-[#475569]"
                }`}
              >
                {pageCount}
              </button>
            ) : null}
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8edf3] disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]);
                setPage(1);
              }}
              className="ml-2 h-8 rounded-lg border border-[#e8edf3] px-2 text-[12px] outline-none"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} / sayfa
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
