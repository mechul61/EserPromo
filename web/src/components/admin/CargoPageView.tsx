"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  Link2,
  Menu,
  MoreVertical,
  Package,
  RotateCcw,
  Search,
  Truck,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { FloatingMenu } from "@/components/admin/FloatingMenu";
import { SITE_CONTACT } from "@/data/catalog-page";
import { downloadCsv } from "@/lib/admin/csv";
import {
  CARGO_COMPANIES,
  CARGO_STATUS_LABEL,
  CARGO_TAB_LABEL,
  cargoTrackingUrl,
  type CargoCompanyId,
  type CargoTabId,
} from "@/lib/commerce/cargo";
import { formatPriceTry } from "@/lib/media";

export type CargoKpi = {
  label: string;
  value: string;
  hint: string;
  color: string;
  icon: "today" | "shipped" | "waiting" | "delivered";
};

export type CargoRow = {
  id: string;
  publicNumber: string;
  customer: string;
  email: string;
  source: string;
  createdAt: string;
  grandTotal: number;
  status: string;
  tab: CargoTabId;
  cargoCompany: string;
  trackingNo: string;
  trackingUrl: string;
  city: string;
  district: string;
  address: string;
};

const KPI_ICONS = {
  today: Truck,
  shipped: CheckCircle2,
  waiting: Clock3,
  delivered: Package,
} as const;

const PAGE_SIZES = [10, 25, 50] as const;

const TAB_TONE: Record<CargoTabId, string> = {
  waiting: "bg-[#fff4e5] text-[#d97706]",
  shipped: "bg-[#e8f0ff] text-[#2563eb]",
  delivered: "bg-[#e9f9ef] text-[#16a34a]",
  returned: "bg-[#fde8f0] text-[#dc2626]",
};

function pageItems(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1) as Array<number | "…">;
  const items: Array<number | "…"> = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) items.push("…");
  for (let n = from; n <= to; n += 1) items.push(n);
  if (to < total - 1) items.push("…");
  items.push(total);
  return items;
}

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CargoPageView({ orders, kpis }: { orders: CargoRow[]; kpis: CargoKpi[] }) {
  const router = useRouter();
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [tab, setTab] = useState<CargoTabId>("waiting");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState(orders);
  const [menu, setMenu] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCompany, setBulkCompany] = useState<CargoCompanyId | "">("");
  const [linkId, setLinkId] = useState<string | null>(null);

  useEffect(() => {
    setRows(orders);
  }, [orders]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(draftQuery);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draftQuery]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        headerSearchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(
    () => ({
      waiting: rows.filter((row) => row.tab === "waiting").length,
      shipped: rows.filter((row) => row.tab === "shipped").length,
      delivered: rows.filter((row) => row.tab === "delivered").length,
      returned: rows.filter((row) => row.tab === "returned").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (row.tab !== tab) return false;
      if (q && !`${row.publicNumber} ${row.customer} ${row.email} ${row.trackingNo}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && row.tab !== statusFilter) return false;
      if (companyFilter !== "all" && row.cargoCompany !== companyFilter) return false;
      if (fromDate && new Date(row.createdAt) < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && new Date(row.createdAt) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [rows, tab, query, statusFilter, companyFilter, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));
  const menuRow = menu ? rows.find((row) => row.id === menu.id) : null;

  function live(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setStatusFilter("all");
    setCompanyFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function patchLocal(id: string, patch: Partial<CargoRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function saveCargo(row: CargoRow, patch: Partial<Pick<CargoRow, "cargoCompany" | "trackingNo" | "trackingUrl">> & { status?: string }) {
    const cargoCompany = patch.cargoCompany ?? row.cargoCompany;
    const trackingNo = patch.trackingNo ?? row.trackingNo;
    const trackingUrl = patch.trackingUrl ?? cargoTrackingUrl(cargoCompany, trackingNo, row.trackingUrl);
    const res = await fetch(`/api/admin/orders/${row.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cargoCompany, trackingNo, trackingUrl, ...(patch.status ? { status: patch.status } : {}) }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "Güncellenemedi");
      return false;
    }
    return true;
  }

  async function shipOne(row: CargoRow) {
    if (!row.cargoCompany) {
      setNotice("Önce kargo firması seçin.");
      return;
    }
    const ok = await saveCargo(row, { status: "shipped" });
    if (!ok) return;
    setNotice(`${row.publicNumber} kargoya verildi.`);
    router.refresh();
  }

  async function bulk(action: "ship" | "complete" | "return", company?: string) {
    const ids = [...selected];
    if (!ids.length) {
      setNotice("Önce sipariş seçin.");
      return;
    }
    if (action === "ship" && !company && ids.some((id) => !rows.find((row) => row.id === id)?.cargoCompany)) {
      setBulkOpen(true);
      return;
    }
    const res = await fetch("/api/admin/orders/cargo/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, action, cargoCompany: company || undefined }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "İşlem başarısız");
      return;
    }
    setSelected(new Set());
    setBulkOpen(false);
    setNotice("Toplu kargo işlemi uygulandı.");
    router.refresh();
  }

  function exportManifest() {
    const source = selected.size ? filtered.filter((row) => selected.has(row.id)) : filtered;
    downloadCsv(
      "kargo-manifestosu.csv",
      ["siparisNo", "musteri", "email", "adres", "ilce", "sehir", "tutar", "firma", "takipNo", "takipUrl", "durum"],
      source.map((row) => [
        row.publicNumber,
        row.customer,
        row.email,
        row.address,
        row.district,
        row.city,
        row.grandTotal,
        row.cargoCompany ? CARGO_COMPANIES[row.cargoCompany as CargoCompanyId] ?? row.cargoCompany : "",
        row.trackingNo,
        cargoTrackingUrl(row.cargoCompany, row.trackingNo, row.trackingUrl),
        CARGO_STATUS_LABEL[row.tab],
      ]),
    );
    setNotice(`${source.length} kayıt manifesto olarak indirildi.`);
  }

  const tabs: Array<{ id: CargoTabId; label: string; count: number }> = [
    { id: "waiting", label: CARGO_TAB_LABEL.waiting, count: counts.waiting },
    { id: "shipped", label: CARGO_TAB_LABEL.shipped, count: counts.shipped },
    { id: "delivered", label: CARGO_TAB_LABEL.delivered, count: counts.delivered },
    { id: "returned", label: CARGO_TAB_LABEL.returned, count: counts.returned },
  ];

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
                ref={headerSearchRef}
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder="Arama yapın..."
                className="h-11 w-full rounded-2xl border border-[#e8edf3] bg-[#f8fafc] pl-11 pr-14 text-[13px] outline-none"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[#e8edf3] px-1.5 py-0.5 text-[10px] font-semibold text-[#94a3b8]">⌘ K</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#475569]">
            <Link href="/" className="inline-flex items-center gap-1.5 font-semibold hover:text-navy">
              <ExternalLink className="size-4" />
              Siteyi Görüntüle
            </Link>
            <a href={SITE_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-[#25d366]">
              <WhatsAppIcon className="size-4" />
              {SITE_CONTACT.whatsapp}
            </a>
            <a href="/hesabim/bildirimler/" className="relative inline-flex size-9 items-center justify-center rounded-full bg-[#f8fafc]">
              <Bell className="size-4" />
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[#ef4444] text-[9px] font-extrabold text-white">7</span>
            </a>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-[#e8eef7] text-[12px] font-extrabold text-navy">Y</span>
              <div className="leading-tight">
                <p className="text-[13px] font-extrabold text-[#0f172a]">Yönetici</p>
                <p className="text-[11px] text-[#94a3b8]">Super Admin</p>
              </div>
              <ChevronDown className="size-4 text-[#94a3b8]" />
            </div>
          </div>
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Kargo Yönetimi</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Siparişleri kargoya verin, takip numarası ekleyin ve teslimatları yönetin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportManifest} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-4 text-[13px] font-semibold text-[#475569] shadow-sm">
            <Download className="size-4" />
            Kargo Manifestosu İndir
          </button>
          <button type="button" onClick={() => void bulk("ship")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
            <Package className="size-4" />
            Toplu Kargoya Ver
          </button>
        </div>
      </div>
      {notice ? <p className="mt-3 text-[13px] font-semibold text-[#2563eb]">{notice}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((card) => {
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
                  <p className="mt-2 text-[11px] font-semibold text-[#64748b]">{card.hint}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          {showFilters ? (
            <section className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="grid gap-3 lg:grid-cols-5">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
                  <div className="relative">
                    <input
                      value={draftQuery}
                      onChange={(e) => setDraftQuery(e.target.value)}
                      placeholder="Sipariş no, müşteri veya kargo no..."
                      className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 pr-10 text-[13px] outline-none placeholder:text-[#94a3b8]"
                    />
                    <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <FilterSelect label="Durum" value={statusFilter} onChange={(value) => live(setStatusFilter, value)} options={[["all", "Tümü"], ...Object.entries(CARGO_TAB_LABEL)]} />
                <FilterSelect label="Kargo Firması" value={companyFilter} onChange={(value) => live(setCompanyFilter, value)} options={[["all", "Tümü"], ...Object.entries(CARGO_COMPANIES)]} />
                <FieldDate label="Başlangıç Tarihi" value={fromDate} onChange={(value) => live(setFromDate, value)} />
                <FieldDate label="Bitiş Tarihi" value={toDate} onChange={(value) => live(setToDate, value)} />
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={clearFilters} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-4 text-[13px] font-medium text-[#475569]">
                  <RotateCcw className="size-4" />
                  Temizle
                </button>
              </div>
            </section>
          ) : (
            <button type="button" onClick={() => setShowFilters(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] px-3.5 text-[13px] font-medium text-[#475569]">
              Filtreleri Göster
            </button>
          )}

          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap gap-5 border-b border-[#e8edf3] px-6">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setPage(1);
                  }}
                  className={`-mb-px border-b-[3px] py-4 text-[13px] font-bold ${tab === item.id ? "border-[#2f6bff] text-[#2f6bff]" : "border-transparent text-[#94a3b8]"}`}
                >
                  {item.label} ({item.count})
                </button>
              ))}
            </div>
            <div className="overflow-x-auto overflow-y-hidden">
              <table className="min-w-[1180px] w-full text-left text-[13px]">
                <thead className="border-b border-[#eef2f7] bg-[#fafbfc] text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (allSelected) pageRows.forEach((row) => next.delete(row.id));
                            else pageRows.forEach((row) => next.add(row.id));
                            return next;
                          });
                        }}
                      />
                    </th>
                    <th className="px-3 py-3">Sipariş No</th>
                    <th className="px-3 py-3">Müşteri</th>
                    <th className="px-3 py-3">Tarih</th>
                    <th className="px-3 py-3">Tutar</th>
                    <th className="px-3 py-3">Kargo Firması</th>
                    <th className="px-3 py-3">Kargo Numarası</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#94a3b8]">Kayıt bulunamadı.</td>
                    </tr>
                  ) : (
                    pageRows.map((row) => {
                      const trackHref = cargoTrackingUrl(row.cargoCompany, row.trackingNo, row.trackingUrl);
                      return (
                        <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0">
                          <td className="px-4 py-4">
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
                          <td className="px-3 py-4">
                            <Link href={`/admin/siparisler/${row.publicNumber}/`} className="font-extrabold text-[#2f6bff]">
                              #{row.publicNumber}
                            </Link>
                            <p className="text-[11px] font-bold text-[#94a3b8]">{row.source}</p>
                          </td>
                          <td className="px-3 py-4">
                            <p className="font-bold text-[#0f172a]">{row.customer}</p>
                            <p className="text-[12px] text-[#94a3b8]">{row.email}</p>
                          </td>
                          <td className="px-3 py-4 text-[12px] text-[#64748b]">{fmtWhen(row.createdAt)}</td>
                          <td className="px-3 py-4 font-extrabold">₺{formatPriceTry(row.grandTotal)}</td>
                          <td className="px-3 py-4">
                            <select
                              value={row.cargoCompany}
                              onChange={(e) => {
                                const cargoCompany = e.target.value;
                                patchLocal(row.id, { cargoCompany, trackingUrl: cargoTrackingUrl(cargoCompany, row.trackingNo, "") });
                                void saveCargo({ ...row, cargoCompany }, { cargoCompany });
                              }}
                              className="h-9 w-[150px] rounded-lg border border-[#dbe3ee] bg-white px-2 text-[12px] outline-none"
                            >
                              <option value="">Seçin</option>
                              {Object.entries(CARGO_COMPANIES).map(([id, label]) => (
                                <option key={id} value={id}>{label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-4 align-top">
                            <input
                              value={row.trackingNo}
                              placeholder="Kargo numarası girin"
                              onChange={(e) => patchLocal(row.id, { trackingNo: e.target.value })}
                              onBlur={(e) => {
                                const trackingNo = e.target.value;
                                const current = rows.find((item) => item.id === row.id) ?? row;
                                void saveCargo({ ...current, trackingNo }, { trackingNo });
                              }}
                              className="h-9 w-[170px] rounded-lg border border-[#dbe3ee] px-2 text-[12px] outline-none"
                            />
                            {linkId === row.id ? (
                              <div className="mt-1 space-y-1">
                                <input
                                  autoFocus
                                  value={row.trackingUrl}
                                  placeholder="https://..."
                                  onChange={(e) => patchLocal(row.id, { trackingUrl: e.target.value })}
                                  onBlur={(e) => {
                                    const trackingUrl = e.target.value;
                                    const current = rows.find((item) => item.id === row.id) ?? row;
                                    void saveCargo({ ...current, trackingUrl }, { trackingUrl });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      e.currentTarget.blur();
                                      setLinkId(null);
                                    }
                                    if (e.key === "Escape") setLinkId(null);
                                  }}
                                  className="h-8 w-[170px] rounded-lg border border-[#dbe3ee] px-2 text-[11px] outline-none"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="text-[11px] font-bold text-[#64748b] hover:text-[#334155]"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setLinkId(null)}
                                  >
                                    Kapat
                                  </button>
                                  {trackHref ? (
                                    <a
                                      href={trackHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2f6bff]"
                                    >
                                      <ExternalLink className="size-3" />
                                      Takibi aç
                                    </a>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#2f6bff]"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setLinkId(row.id)}
                              >
                                <Link2 className="size-3" />
                                Kargo takip linki (opsiyonel)
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${TAB_TONE[row.tab]}`}>{CARGO_STATUS_LABEL[row.tab]}</span>
                          </td>
                          <td className="relative overflow-visible px-3 py-4 align-top">
                            <div className="flex items-center justify-end gap-1">
                              {row.tab === "waiting" ? (
                                <button type="button" onClick={() => void shipOne(row)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#2f6bff] px-2.5 text-[11px] font-bold text-white">
                                  <Package className="size-3.5" />
                                  Kargoya Ver
                                </button>
                              ) : row.tab === "shipped" ? (
                                <button type="button" onClick={() => void saveCargo(row, { status: "completed" }).then((ok) => ok && router.refresh())} className="inline-flex h-8 items-center rounded-lg border border-[#e8edf3] px-2.5 text-[11px] font-bold text-[#334155]">
                                  Teslim
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]"
                                onClick={(e) => {
                                  const el = e.currentTarget;
                                  setMenu((prev) => (prev?.id === row.id ? null : { id: row.id, el }));
                                }}
                              >
                                <MoreVertical className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-[#eef2f7] px-4 py-3 text-[12px] text-[#64748b] lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <p>{filtered.length.toLocaleString("tr-TR")} kayıttan {filtered.length === 0 ? "0" : start + 1}-{Math.min(filtered.length, start + pageSize)} arası gösteriliyor</p>
              <div className="flex items-center justify-center gap-1">
                <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8edf3] disabled:opacity-40">
                  <ChevronLeft className="size-4" />
                </button>
                {pageItems(currentPage, pageCount).map((item, i) =>
                  item === "…" ? (
                    <span key={`e-${i}`} className="px-1">…</span>
                  ) : (
                    <button key={item} type="button" onClick={() => setPage(item)} className={`inline-flex size-8 items-center justify-center rounded-lg text-[12px] font-bold ${currentPage === item ? "bg-[#2f6bff] text-white" : "border border-[#e8edf3] text-[#475569]"}`}>
                      {item}
                    </button>
                  ),
                )}
                <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8edf3] disabled:opacity-40">
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="flex justify-end">
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]); setPage(1); }} className="h-8 rounded-lg border border-[#e8edf3] px-2 text-[12px] outline-none">
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>{size} / sayfa</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Kargo işlemleri nasıl çalışır?</h2>
            <ol className="space-y-3 text-[12px] text-[#334155]">
              {[
                ["1", "Kargolanacak siparişleri seçin"],
                ["2", "Kargo firmasını belirleyin"],
                ["3", "Takip numarası ve link ekleyin"],
                ["4", "Kargoya ver ile kaydedin"],
              ].map(([n, text]) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#e8f0ff] text-[11px] font-extrabold text-[#2f6bff]">{n}</span>
                  {text}
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-[18px] bg-[#eef4ff] p-4">
            <h2 className="text-[12px] font-extrabold tracking-wide text-[#1e3a8a] uppercase">Toplu kargoya ver</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">Seçili bekleyen siparişlere aynı firmayı atayıp tek seferde kargoya verebilirsiniz.</p>
            <button type="button" onClick={() => void bulk("ship")} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2f6bff] text-[13px] font-semibold text-white">
              <Package className="size-4" />
              Toplu Kargoya Ver
            </button>
          </section>
        </aside>
      </div>

      {menu && menuRow ? (
        <FloatingMenu anchor={menu.el} onClose={() => setMenu(null)}>
          <Link
            href={`/admin/siparisler/${menuRow.publicNumber}/`}
            className="block px-3 py-2 text-[12px] hover:bg-[#f8fafc]"
            onClick={() => setMenu(null)}
          >
            Siparişi aç
          </Link>
          {menuRow.tab !== "returned" ? (
            <button
              type="button"
              className="flex w-full px-3 py-2 text-left text-[12px] text-[#dc2626] hover:bg-[#fef2f2]"
              onClick={() => {
                setMenu(null);
                setSelected(new Set([menuRow.id]));
                void bulk("return");
              }}
            >
              İade olarak işaretle
            </button>
          ) : null}
        </FloatingMenu>
      ) : null}

      {bulkOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between">
              <h2 className="text-[16px] font-extrabold">Toplu kargoya ver</h2>
              <button type="button" onClick={() => setBulkOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
            </div>
            <p className="mt-2 text-[13px] text-[#64748b]">{selected.size} sipariş seçildi. Firma seçilmeyenlere bu firma uygulanır.</p>
            <label className="mt-4 block text-[12px] font-bold text-[#334155]">
              Kargo firması
              <select value={bulkCompany} onChange={(e) => setBulkCompany(e.target.value as CargoCompanyId | "")} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none">
                <option value="">Seçin</option>
                {Object.entries(CARGO_COMPANIES).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setBulkOpen(false)} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">Vazgeç</button>
              <button
                type="button"
                disabled={!bulkCompany}
                onClick={() => void bulk("ship", bulkCompany)}
                className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                Kargoya ver
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">{label}</span>
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none">
          {options.map(([id, text]) => (
            <option key={id} value={id}>{text}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
      </div>
    </label>
  );
}

function FieldDate({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">{label}</span>
      <div className="relative">
        <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 pr-10 text-[13px] text-[#64748b] outline-none" />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
      </div>
    </label>
  );
}
