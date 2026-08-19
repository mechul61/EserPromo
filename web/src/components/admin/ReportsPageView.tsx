"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  ExternalLink,
  FileBarChart2,
  FilePlus2,
  FileSpreadsheet,
  LayoutTemplate,
  Menu,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Ticket,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { downloadCsv } from "@/lib/admin/csv";
import {
  REPORT_CATEGORY_LABEL,
  REPORT_KIND_LABEL,
  REPORT_SCHEDULE_LABEL,
  REPORT_SOURCES,
  type ReportCategoryId,
  type ReportKindId,
  type ReportScheduleId,
  type ReportSourceId,
} from "@/lib/commerce/reports-copy";

export type ReportKpi = {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  color: string;
  icon: "total" | "created" | "download" | "schedule" | "records";
};

export type SavedReportRow = {
  id: string;
  key: string;
  name: string;
  description: string;
  source: string;
  category: ReportCategoryId;
  categoryLabel: string;
  kind: ReportKindId;
  kindLabel: string;
  icon: string;
  schedule: ReportScheduleId;
  scheduleLabel: string;
  isShared: boolean;
  isSystem: boolean;
  creatorName: string;
  runCount: number;
  lastRunAt: string | null;
  createdAt: string;
  spark: number[];
};

export type CategoryCount = { id: ReportCategoryId; label: string; count: number };

const KPI_ICONS = {
  total: FileBarChart2,
  created: FilePlus2,
  download: Download,
  schedule: CalendarClock,
  records: Package,
} as const;

const ICON_MAP = {
  cart: ShoppingCart,
  users: Users,
  box: Package,
  tag: Tag,
  wallet: Wallet,
  card: CreditCard,
  ticket: Ticket,
  truck: Truck,
  bag: ShoppingBag,
  chart: FileBarChart2,
} as const;

const ICON_TONE: Record<string, string> = {
  cart: "bg-[#e9f9ef] text-[#16a34a]",
  users: "bg-[#f1e9ff] text-[#7c3aed]",
  box: "bg-[#fff4e5] text-[#d97706]",
  tag: "bg-[#e8f0ff] text-[#2563eb]",
  wallet: "bg-[#e0f2fe] text-[#0284c7]",
  card: "bg-[#e8f0ff] text-[#2563eb]",
  ticket: "bg-[#fce7f3] text-[#db2777]",
  truck: "bg-[#e8f0ff] text-[#2563eb]",
  bag: "bg-[#fce7f3] text-[#db2777]",
  chart: "bg-[#e8f0ff] text-[#2563eb]",
};

const CAT_TONE: Record<ReportCategoryId, string> = {
  sales: "bg-[#e9f9ef] text-[#16a34a]",
  customer: "bg-[#f1e9ff] text-[#7c3aed]",
  product: "bg-[#fff4e5] text-[#d97706]",
  finance: "bg-[#e0f2fe] text-[#0284c7]",
  marketing: "bg-[#fce7f3] text-[#db2777]",
  other: "bg-[#eef2f7] text-[#475569]",
};

const CAT_COLOR: Record<ReportCategoryId, string> = {
  sales: "#22c55e",
  customer: "#7c3aed",
  product: "#f59e0b",
  finance: "#0ea5e9",
  marketing: "#db2777",
  other: "#94a3b8",
};

const PAGE_SIZES = [10, 25, 50] as const;
type TabId = "all" | "scheduled" | "shared";

function pctFmt(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

function fmtWhen(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Spark({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const points = values
    .map((value, i) => {
      const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * 56;
      const y = 18 - (value / max) * 16;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" className="text-[#22c55e]" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.8" points={points} />
    </svg>
  );
}

export function ReportsPageView({
  reports,
  kpis,
  categoryCounts,
}: {
  reports: SavedReportRow[];
  kpis: ReportKpi[];
  categoryCounts: CategoryCount[];
}) {
  const router = useRouter();
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [tab, setTab] = useState<TabId>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [rows, setRows] = useState(reports);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [edit, setEdit] = useState<SavedReportRow | "new" | "scheduled" | null>(null);
  const [preview, setPreview] = useState<{ name: string; headers: string[]; rows: Array<Array<string | number>>; total: number; source: string } | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => setRows(reports), [reports]);

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

  const creators = useMemo(() => [...new Set(rows.map((row) => row.creatorName))], [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab === "scheduled" && row.schedule === "none") return false;
      if (tab === "shared" && !row.isShared) return false;
      if (q && !`${row.name} ${row.description} ${row.categoryLabel}`.toLowerCase().includes(q)) return false;
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;
      if (creatorFilter !== "all" && row.creatorName !== creatorFilter) return false;
      if (fromDate && new Date(row.createdAt) < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && new Date(row.createdAt) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [rows, tab, query, categoryFilter, kindFilter, creatorFilter, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const popular = [...rows].sort((a, b) => b.runCount - a.runCount).slice(0, 4);
  const totalCats = Math.max(1, categoryCounts.reduce((sum, row) => sum + row.count, 0));

  function live(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  async function previewReport(row: SavedReportRow) {
    if (row.source === "revenue") {
      window.open("/admin/ciro/", "_blank");
    }
    const res = await fetch(`/api/admin/reports/${row.id}/export/?preview=1`);
    const data = (await res.json()) as {
      error?: string;
      name?: string;
      headers?: string[];
      rows?: Array<Array<string | number>>;
      total?: number;
      source?: string;
    };
    if (!res.ok) {
      setNotice(data.error || "Rapor açılamadı");
      return;
    }
    setPreview({
      name: data.name || row.name,
      headers: data.headers || [],
      rows: data.rows || [],
      total: data.total || 0,
      source: data.source || row.source,
    });
    router.refresh();
  }

  async function downloadReport(row: SavedReportRow) {
    const res = await fetch(`/api/admin/reports/${row.id}/export/`);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setNotice(data?.error || "İndirilemedi");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${row.name.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(`${row.name} indirildi.`);
    router.refresh();
  }

  async function remove(row: SavedReportRow) {
    if (row.isSystem) {
      setNotice("Sistem raporları silinemez.");
      return;
    }
    const res = await fetch(`/api/admin/reports/${row.id}/`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "Silinemedi");
      return;
    }
    setNotice("Rapor silindi.");
    router.refresh();
  }

  function exportCatalog() {
    downloadCsv(
      "rapor-katalogu.csv",
      ["ad", "kategori", "tur", "kaynak", "olusturan", "zamanlama", "calisma"],
      filtered.map((row) => [row.name, row.categoryLabel, row.kindLabel, row.source, row.creatorName, row.scheduleLabel, row.runCount]),
    );
    setNotice(`${filtered.length} rapor kataloğu indirildi.`);
  }

  const donut = categoryCounts
    .filter((row) => row.count > 0)
    .reduce<{ parts: string[]; acc: number }>(
      (state, row) => {
        const next = state.acc + (row.count / totalCats) * 100;
        state.parts.push(`${CAT_COLOR[row.id]} ${state.acc}% ${next}%`);
        state.acc = next;
        return state;
      },
      { parts: [], acc: 0 },
    ).parts.join(", ");

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
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Raporlar</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Mağazanızın verilerini analiz edin ve detaylı raporlar oluşturun.</p>
        </div>
        <button type="button" onClick={() => setEdit("new")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
          <Plus className="size-4" />
          Yeni Rapor Oluştur
        </button>
      </div>
      {notice ? <p className="mt-3 text-[13px] font-semibold text-[#2563eb]">{notice}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((card) => {
          const Icon = KPI_ICONS[card.icon];
          const up = (card.delta ?? 0) >= 0;
          return (
            <div key={card.label} className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${card.color} text-white`}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">{card.label}</p>
                  <p className="mt-1 truncate text-[22px] font-extrabold leading-none text-[#0f172a]">{card.value}</p>
                  {card.delta !== undefined ? (
                    <p className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${up ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                      {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                      %{pctFmt(card.delta)} Geçen aya göre
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] font-semibold text-[#64748b]">{card.hint}</p>
                  )}
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
                  <input value={draftQuery} onChange={(e) => setDraftQuery(e.target.value)} placeholder="Ad, açıklama veya anahtar..." className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
                </label>
                <FilterSelect label="Kategori" value={categoryFilter} onChange={(value) => live(setCategoryFilter, value)} options={[["all", "Tümü"], ...Object.entries(REPORT_CATEGORY_LABEL)]} />
                <FilterSelect label="Rapor Türü" value={kindFilter} onChange={(value) => live(setKindFilter, value)} options={[["all", "Tümü"], ...Object.entries(REPORT_KIND_LABEL)]} />
                <FilterSelect label="Oluşturan" value={creatorFilter} onChange={(value) => live(setCreatorFilter, value)} options={[["all", "Tümü"], ...creators.map((name) => [name, name] as [string, string])]} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="block min-w-0">
                    <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Başlangıç</span>
                    <input type="date" value={fromDate} onChange={(e) => live(setFromDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 text-[13px] outline-none" />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Bitiş</span>
                    <input type="date" value={toDate} onChange={(e) => live(setToDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 text-[13px] outline-none" />
                  </label>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={() => setShowFilters(false)} className="text-[13px] font-semibold text-[#64748b]">Filtreleri Gizle</button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftQuery("");
                    setQuery("");
                    setCategoryFilter("all");
                    setKindFilter("all");
                    setCreatorFilter("all");
                    setFromDate("");
                    setToDate("");
                    setPage(1);
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] px-4 text-[13px] font-medium text-[#475569]"
                >
                  <RotateCcw className="size-4" />
                  Temizle
                </button>
              </div>
            </section>
          ) : (
            <button type="button" onClick={() => setShowFilters(true)} className="inline-flex h-10 items-center rounded-lg border border-[#dbe3ee] px-3.5 text-[13px] font-medium text-[#475569]">
              Filtreleri Göster
            </button>
          )}

          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap gap-5 border-b border-[#e8edf3] px-6">
              {([
                ["all", "Tüm Raporlar"],
                ["scheduled", "Zamanlanan Raporlar"],
                ["shared", "Paylaşılan Raporlar"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    setPage(1);
                  }}
                  className={`-mb-px border-b-[3px] py-4 text-[13px] font-bold ${tab === id ? "border-[#2f6bff] text-[#2f6bff]" : "border-transparent text-[#94a3b8]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full text-left text-[13px]">
                <thead className="border-b border-[#eef2f7] text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">
                  <tr>
                    <th className="px-4 py-3">Rapor Adı</th>
                    <th className="px-3 py-3">Kategori</th>
                    <th className="px-3 py-3">Rapor Türü</th>
                    <th className="px-3 py-3">Oluşturan</th>
                    <th className="px-3 py-3">Oluşturulma Tarihi</th>
                    <th className="px-3 py-3">Son Çalıştırma</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-[#94a3b8]">Rapor bulunamadı.</td>
                    </tr>
                  ) : (
                    pageRows.map((row) => {
                      const Icon = ICON_MAP[row.icon as keyof typeof ICON_MAP] ?? FileBarChart2;
                      return (
                        <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0">
                          <td className="px-4 py-4">
                            <div className="flex items-start gap-3">
                              <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${ICON_TONE[row.icon] || ICON_TONE.chart}`}>
                                <Icon className="size-4" />
                              </span>
                              <div>
                                <p className="font-bold text-[#0f172a]">{row.name}</p>
                                <p className="max-w-[260px] truncate text-[12px] text-[#94a3b8]">{row.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${CAT_TONE[row.category]}`}>{row.categoryLabel}</span>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${row.kind === "chart" ? "bg-[#e9f9ef] text-[#16a34a]" : "bg-[#e8f0ff] text-[#2563eb]"}`}>{row.kindLabel}</span>
                          </td>
                          <td className="px-3 py-4">
                            <p className="font-semibold text-[#0f172a]">{row.creatorName}</p>
                            <p className="text-[11px] text-[#94a3b8]">Super Admin</p>
                          </td>
                          <td className="px-3 py-4 text-[12px] text-[#64748b]">{fmtWhen(row.createdAt)}</td>
                          <td className="px-3 py-4 text-[12px] text-[#64748b]">{fmtWhen(row.lastRunAt)}</td>
                          <td className="relative px-3 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => void previewReport(row)}>
                                <Eye className="size-4" />
                              </button>
                              <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => void downloadReport(row)}>
                                <Download className="size-4" />
                              </button>
                              <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setMenuId(menuId === row.id ? null : row.id)}>
                                <MoreVertical className="size-4" />
                              </button>
                            </div>
                            {menuId === row.id ? (
                              <div className="absolute right-3 top-12 z-20 w-44 overflow-hidden rounded-xl border border-[#e8edf3] bg-white py-1 shadow-lg">
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]" onClick={() => { setMenuId(null); setEdit(row); }}>
                                  <Pencil className="size-3.5" /> Düzenle
                                </button>
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#dc2626] hover:bg-[#fef2f2]" onClick={() => { setMenuId(null); void remove(row); }}>
                                  <Trash2 className="size-3.5" /> Sil
                                </button>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f7] px-4 py-3 text-[12px] text-[#64748b]">
              <p>
                {filtered.length.toLocaleString("tr-TR")} kayıttan {filtered.length === 0 ? "0" : start + 1} - {Math.min(filtered.length, start + pageSize)} arası gösteriliyor
              </p>
              <div className="flex items-center gap-1">
                <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8edf3] disabled:opacity-40">
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: Math.min(6, pageCount) }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => setPage(n)} className={`inline-flex size-8 items-center justify-center rounded-lg text-[12px] font-bold ${currentPage === n ? "bg-[#2f6bff] text-white" : "border border-[#e8edf3] text-[#475569]"}`}>
                    {n}
                  </button>
                ))}
                <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8edf3] disabled:opacity-40">
                  <ChevronRight className="size-4" />
                </button>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]); setPage(1); }} className="ml-2 h-8 rounded-lg border border-[#e8edf3] px-2 text-[12px]">
                  {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / sayfa</option>)}
                </select>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Hızlı İşlemler</h2>
            <div className="space-y-2">
              <QuickAction icon={FilePlus2} color="bg-[#e8f0ff] text-[#2563eb]" title="Yeni Rapor Oluştur" onClick={() => setEdit("new")} />
              <QuickAction icon={CalendarClock} color="bg-[#e9f9ef] text-[#16a34a]" title="Zamanlanan Rapor Oluştur" onClick={() => setEdit("scheduled")} />
              <QuickAction icon={LayoutTemplate} color="bg-[#f1e9ff] text-[#7c3aed]" title="Rapor Şablonları" onClick={() => setSourcesOpen(true)} />
              <QuickAction icon={FileSpreadsheet} color="bg-[#fff4e5] text-[#d97706]" title="Raporları Dışa Aktar" onClick={exportCatalog} />
            </div>
          </section>
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Popüler Raporlar</h2>
            <ul className="space-y-3">
              {popular.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-[#0f172a]">{row.name}</p>
                    <p className="text-[11px] text-[#94a3b8]">{row.runCount.toLocaleString("tr-TR")} kez çalıştırıldı</p>
                  </div>
                  <Spark values={row.spark} />
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Rapor Kategorileri</h2>
            <div className="flex items-center gap-4">
              <div
                className="relative grid size-28 shrink-0 place-items-center rounded-full"
                style={{ background: `conic-gradient(${donut || "#e8edf3 0 100%"})` }}
              >
                <span className="grid size-16 place-items-center rounded-full bg-white text-center">
                  <span className="block text-[16px] font-extrabold leading-none">{rows.length}</span>
                  <span className="text-[10px] text-[#94a3b8]">Toplam</span>
                </span>
              </div>
              <ul className="min-w-0 space-y-1.5 text-[12px]">
                {categoryCounts.filter((row) => row.count > 0).map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: CAT_COLOR[row.id] }} />
                      {row.label}
                    </span>
                    <span className="font-semibold">{row.count} (%{((row.count / totalCats) * 100).toFixed(1).replace(".", ",")})</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </aside>
      </div>

      {preview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-extrabold">{preview.name}</h2>
                <p className="text-[12px] text-[#94a3b8]">{preview.total.toLocaleString("tr-TR")} kayıt · ilk {preview.rows.length} satır</p>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
            </div>
            {preview.source === "revenue" ? (
              <Link href="/admin/ciro/" className="mt-3 inline-flex text-[13px] font-bold text-[#2f6bff]">Ciro ekranını aç →</Link>
            ) : null}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[#eef2f7] text-[#94a3b8]">
                    {preview.headers.map((h) => <th key={h} className="px-2 py-2 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-b border-[#f8fafc]">
                      {row.map((cell, j) => <td key={j} className="px-2 py-2 text-[#334155]">{String(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {sourcesOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between">
              <h2 className="text-[16px] font-extrabold">Rapor şablonları</h2>
              <button type="button" onClick={() => setSourcesOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
            </div>
            <ul className="mt-4 space-y-2">
              {Object.entries(REPORT_SOURCES).map(([id, meta]) => (
                <li key={id} className="rounded-xl border border-[#eef2f7] px-3 py-2">
                  <p className="text-[13px] font-bold">{meta.name}</p>
                  <p className="text-[12px] text-[#94a3b8]">{meta.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {edit ? (
        <ReportEditor
          report={edit === "new" || edit === "scheduled" ? null : edit}
          defaultSchedule={edit === "scheduled" ? "daily" : undefined}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function QuickAction({ icon: Icon, color, title, onClick }: { icon: typeof FilePlus2; color: string; title: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left hover:bg-[#f8fafc]">
      <span className={`grid size-9 place-items-center rounded-xl ${color}`}>
        <Icon className="size-4" />
      </span>
      <span className="text-[13px] font-semibold text-[#0f172a]">{title}</span>
    </button>
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none">
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );
}

function ReportEditor({
  report,
  defaultSchedule,
  onClose,
  onSaved,
}: {
  report: SavedReportRow | null;
  defaultSchedule?: ReportScheduleId;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstSource = Object.keys(REPORT_SOURCES)[0] as ReportSourceId;
  const [form, setForm] = useState({
    name: report?.name ?? "",
    description: report?.description ?? "",
    source: (report?.source as ReportSourceId) ?? firstSource,
    category: report?.category ?? REPORT_SOURCES[firstSource].category,
    kind: report?.kind ?? REPORT_SOURCES[firstSource].kind,
    schedule: report?.schedule ?? defaultSchedule ?? "none",
    isShared: report?.isShared ?? false,
  });

  async function save() {
    setPending(true);
    setError(null);
    const url = report ? `/api/admin/reports/${report.id}/` : "/api/admin/reports/";
    const res = await fetch(url, {
      method: report ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as { error?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Kaydedilemedi");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-extrabold">{report ? "Raporu düzenle" : "Yeni rapor"}</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="block text-[12px] font-bold">
            Ad
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
          </label>
          <label className="block text-[12px] font-bold">
            Açıklama
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
          </label>
          {!report ? (
            <label className="block text-[12px] font-bold">
              Kaynak
              <select
                value={form.source}
                onChange={(e) => {
                  const source = e.target.value as ReportSourceId;
                  const meta = REPORT_SOURCES[source];
                  setForm({ ...form, source, category: meta.category, kind: meta.kind, name: form.name || meta.name, description: form.description || meta.description });
                }}
                className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px]"
              >
                {Object.entries(REPORT_SOURCES).map(([id, meta]) => <option key={id} value={id}>{meta.name}</option>)}
              </select>
            </label>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-bold">
              Tür
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ReportKindId })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px]">
                {Object.entries(REPORT_KIND_LABEL).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
            <label className="block text-[12px] font-bold">
              Zamanlama
              <select value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value as ReportScheduleId })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px]">
                {Object.entries(REPORT_SCHEDULE_LABEL).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" checked={form.isShared} onChange={(e) => setForm({ ...form, isShared: e.target.checked })} />
            Paylaşılan rapor
          </label>
        </div>
        {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">Vazgeç</button>
          <button type="button" disabled={pending} onClick={() => void save()} className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60">{pending ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
      </div>
    </div>
  );
}
