"use client";

import Link from "next/link";
import { useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  CopyPlus,
  Eye,
  FileBarChart2,
  Filter,
  Info,
  Layers,
  Menu,
  MoreVertical,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Search,
  Ticket,
  Trash2,
} from "lucide-react";
import { ConfirmDialog, CouponEditor } from "@/components/admin/CouponEditor";
import { FloatingMenu } from "@/components/admin/FloatingMenu";
import type { CouponKpi, CouponMonthStats, CouponRow } from "@/components/admin/coupon-types";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { downloadCsv, parseCsv } from "@/lib/admin/csv";
import type { CouponRuntimeStatus } from "@/lib/commerce/coupons";
import { formatPriceTry } from "@/lib/media";

export type { CouponKpi, CouponMonthStats, CouponRow };

const KPI_ICONS = {
  total: Ticket,
  active: CheckCircle2,
  usage: Percent,
  discount: FileBarChart2,
  expired: CalendarDays,
} as const;

const PAGE_SIZES = [10, 25, 50] as const;

const KIND_LABEL = {
  general: "Genel",
  shipping: "Kargo",
  special: "Özel",
  product: "Ürün",
} as const;

const KIND_TONE = {
  general: "bg-[#e8f0ff] text-[#2563eb]",
  shipping: "bg-[#fff4e5] text-[#d97706]",
  special: "bg-[#f1e9ff] text-[#7c3aed]",
  product: "bg-[#ffece5] text-[#ea580c]",
} as const;

const STATUS_TONE: Record<CouponRuntimeStatus, string> = {
  active: "text-[#16a34a]",
  scheduled: "text-[#2563eb]",
  expired: "text-[#94a3b8]",
  disabled: "text-[#dc2626]",
};

const STATUS_LABEL: Record<CouponRuntimeStatus, string> = {
  active: "Aktif",
  scheduled: "Planlandı",
  expired: "Süresi Dolmuş",
  disabled: "Devre Dışı",
};

type TabId = "all" | CouponRuntimeStatus;

function pctFmt(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR");
}

function usageRatio(row: CouponRow) {
  if (row.usageLimit == null || row.usageLimit <= 0) return row.usedCount > 0 ? 100 : 0;
  return Math.min(100, (row.usedCount / row.usageLimit) * 100);
}

export function CouponsPageView({
  coupons,
  kpis,
  monthStats,
}: {
  coupons: CouponRow[];
  kpis: CouponKpi[];
  monthStats: CouponMonthStats;
}) {
  const router = useRouter();
  const importRef = useRef<HTMLInputElement>(null);
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [discountFilter, setDiscountFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [tab, setTab] = useState<TabId>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rows, setRows] = useOptimistic(coupons);
  const [edit, setEdit] = useState<CouponRow | "new" | null>(null);
  const [view, setView] = useState<CouponRow | null>(null);
  const [remove, setRemove] = useState<CouponRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [menu, setMenu] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
      all: rows.length,
      active: rows.filter((row) => row.status === "active").length,
      scheduled: rows.filter((row) => row.status === "scheduled").length,
      expired: rows.filter((row) => row.status === "expired").length,
      disabled: rows.filter((row) => row.status === "disabled").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab !== "all" && row.status !== tab) return false;
      if (q && ![row.code, row.name, row.description ?? ""].join(" ").toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;
      if (discountFilter !== "all" && row.discountKind !== discountFilter) return false;
      if (fromDate && new Date(row.endsAt) < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && new Date(row.startsAt) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [rows, tab, query, statusFilter, kindFilter, discountFilter, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));
  const selectedRows = rows.filter((row) => selected.has(row.id));
  const menuRow = menu ? rows.find((row) => row.id === menu.id) : null;

  function live(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setStatusFilter("all");
    setKindFilter("all");
    setDiscountFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
    setNotice("Filtreler temizlendi.");
  }

  function exportCsv() {
    const source = selected.size ? filtered.filter((row) => selected.has(row.id)) : filtered;
    downloadCsv(
      "kuponlar.csv",
      ["code", "name", "kind", "discountKind", "discountValue", "startsAt", "endsAt", "usageLimit", "usedCount", "active"],
      source.map((row) => [
        row.code,
        row.name,
        row.kind,
        row.discountKind,
        row.discountValue,
        row.startsAt.slice(0, 10),
        row.endsAt.slice(0, 10),
        row.usageLimit ?? "",
        row.usedCount,
        row.isActive,
      ]),
    );
    setNotice(`${source.length} kupon dışa aktarıldı.`);
  }

  function exportReport() {
    downloadCsv(
      "kupon-kullanim-raporu.csv",
      ["code", "name", "status", "usedCount", "usageLimit", "discount"],
      filtered.map((row) => [row.code, row.name, STATUS_LABEL[row.status], row.usedCount, row.usageLimit ?? "sınırsız", row.discountLabel]),
    );
    setNotice("Kullanım raporu indirildi.");
  }

  async function importFile(file: File) {
    const text = await file.text();
    let items: Array<Record<string, unknown>> = [];
    try {
      const json = JSON.parse(text) as unknown;
      if (Array.isArray(json)) items = json as typeof items;
    } catch {
      const table = parseCsv(text);
      const [header, ...rest] = table;
      const idx = (name: string) => header.findIndex((cell) => cell.toLowerCase() === name);
      const codeI = idx("code") >= 0 ? idx("code") : 0;
      const nameI = idx("name") >= 0 ? idx("name") : 1;
      const kindI = idx("kind") >= 0 ? idx("kind") : 2;
      const discKindI = idx("discountkind") >= 0 ? idx("discountkind") : 3;
      const valueI = idx("discountvalue") >= 0 ? idx("discountvalue") : 4;
      const startI = idx("startsat") >= 0 ? idx("startsat") : 5;
      const endI = idx("endsat") >= 0 ? idx("endsat") : 6;
      const limitI = idx("usagelimit") >= 0 ? idx("usagelimit") : 7;
      const activeI = idx("active") >= 0 ? idx("active") : 8;
      const descI = idx("description");
      items = rest.filter((row) => row[codeI] && row[nameI]).map((row) => {
        const kindRaw = (row[kindI] || "general").toLowerCase();
        const kind =
          kindRaw.includes("kargo") || kindRaw === "shipping"
            ? "shipping"
            : kindRaw.includes("özel") || kindRaw.includes("ozel") || kindRaw === "special"
              ? "special"
              : kindRaw.includes("ürün") || kindRaw.includes("urun") || kindRaw === "product"
                ? "product"
                : "general";
        const discRaw = (row[discKindI] || "percent").toLowerCase();
        const discountKind = discRaw.includes("tutar") || discRaw.includes("amount") || discRaw.includes("tl") ? "amount" : "percent";
        return {
          code: row[codeI],
          name: row[nameI],
          description: descI >= 0 ? row[descI] : "",
          kind,
          discountKind,
          discountValue: Number(String(row[valueI] || "0").replace(",", ".")),
          startsAt: row[startI] || new Date().toISOString(),
          endsAt: row[endI] || new Date(Date.now() + 30 * 86400000).toISOString(),
          usageLimit: row[limitI] ? Number(row[limitI]) : null,
          isActive: row[activeI] ? !["0", "false", "pasif", "hayır"].includes(row[activeI].toLowerCase()) : true,
        };
      });
    }
    if (!items.length) {
      setNotice("Dosyada kupon bulunamadı. Sütunlar: code;name;kind;discountKind;discountValue;startsAt;endsAt;usageLimit;active");
      return;
    }
    const res = await fetch("/api/admin/coupons/import/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = (await res.json()) as { error?: string; created?: number; updated?: number; failed?: number };
    if (!res.ok) {
      setNotice(data.error || "İçe aktarma başarısız");
      return;
    }
    setNotice(`${data.created ?? 0} eklendi, ${data.updated ?? 0} güncellendi${data.failed ? `, ${data.failed} hatalı` : ""}.`);
    router.refresh();
  }

  async function copyCoupon(row: CouponRow) {
    const res = await fetch(`/api/admin/coupons/${row.id}/copy/`, { method: "POST" });
    const data = (await res.json()) as { error?: string; code?: string };
    if (!res.ok) {
      setNotice(data.error || "Kopyalanamadı");
      return;
    }
    setNotice(`${data.code} kuponu kopyalandı (devre dışı).`);
    router.refresh();
  }

  async function bulk(action: "activate" | "deactivate" | "delete") {
    if (selected.size === 0) {
      setNotice("Önce tablodan kupon seçin.");
      return;
    }
    const res = await fetch("/api/admin/coupons/bulk/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "Toplu işlem başarısız");
      return;
    }
    setSelected(new Set());
    setBulkOpen(false);
    setNotice("Toplu işlem uygulandı.");
    router.refresh();
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice(`${code} kopyalandı.`);
    } catch {
      setNotice("Kopyalanamadı.");
    }
  }

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "all", label: "Tümü", count: counts.all },
    { id: "active", label: "Aktif", count: counts.active },
    { id: "scheduled", label: "Planlandı", count: counts.scheduled },
    { id: "expired", label: "Süresi Dolmuş", count: counts.expired },
    { id: "disabled", label: "Devre Dışı", count: counts.disabled },
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
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[#e8edf3] px-1.5 py-0.5 text-[10px] font-semibold text-[#94a3b8]">
                ⌘ K
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#475569]">
            <Link href="/" className="inline-flex items-center gap-1.5 font-semibold hover:text-navy">
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
            </div>
          </div>
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Kupon Yönetimi</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Kuponlarınızı oluşturun, düzenleyin ve performanslarını takip edin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importRef}
            type="file"
            accept=".csv,.txt,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void importFile(file);
            }}
          />
          <button type="button" onClick={() => importRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#2f6bff] bg-white px-4 text-[13px] font-semibold text-[#2f6bff]">
            <ArrowDownToLine className="size-4" />
            İçe Aktar
          </button>
          <button type="button" onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#2f6bff] bg-white px-4 text-[13px] font-semibold text-[#2f6bff]">
            <ArrowUpFromLine className="size-4" />
            Dışa Aktar
          </button>
          <button type="button" onClick={() => setEdit("new")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
            <Plus className="size-4" />
            Yeni Kupon
          </button>
        </div>
      </div>
      {notice ? <p className="mt-3 text-[13px] font-semibold text-[#2563eb]">{notice}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
                  <p className={`mt-2 text-[11px] font-semibold ${card.icon === "active" ? "text-[#16a34a]" : "text-[#64748b]"}`}>{card.hint}</p>
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
                      placeholder="Kupon kodu, ad veya açıklama..."
                      className="h-11 w-full rounded-lg border border-[#dbe3ee] bg-white px-3 pr-10 text-[13px] outline-none placeholder:text-[#94a3b8]"
                    />
                    <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <FilterSelect label="Durum" value={statusFilter} onChange={live(setStatusFilter)} options={[["all", "Tümü"], ["active", "Aktif"], ["scheduled", "Planlandı"], ["expired", "Süresi Dolmuş"], ["disabled", "Devre Dışı"]]} />
                <FilterSelect label="Kupon Türü" value={kindFilter} onChange={live(setKindFilter)} options={[["all", "Tümü"], ["general", "Genel"], ["shipping", "Kargo"], ["special", "Özel"], ["product", "Ürün"]]} />
                <FilterSelect label="İndirim Türü" value={discountFilter} onChange={live(setDiscountFilter)} options={[["all", "Tümü"], ["percent", "Yüzde"], ["amount", "Tutar"]]} />
                <div className="min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Geçerlilik Tarihi</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={fromDate} onChange={(e) => live(setFromDate)(e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 text-[12px] text-[#64748b] outline-none" title="Başlangıç tarihi" />
                    <input type="date" value={toDate} onChange={(e) => live(setToDate)(e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 text-[12px] text-[#64748b] outline-none" title="Bitiş tarihi" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => setShowFilters(false)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2f6bff] bg-white px-3.5 text-[13px] font-medium text-[#2f6bff]">
                  <Filter className="size-4" />
                  Filtreleri Gizle
                  <ChevronUp className="size-4" />
                </button>
                <div className="flex gap-2.5">
                  <button type="button" onClick={clearFilters} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2f6bff] bg-white px-4 text-[13px] font-medium text-[#2f6bff]">
                    <RotateCcw className="size-4" />
                    Temizle
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <button type="button" onClick={() => setShowFilters(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#2f6bff] bg-white px-3.5 text-[13px] font-medium text-[#2f6bff]">
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
              <table className="min-w-[1080px] w-full text-left text-[13px]">
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
                    <th className="px-3 py-3">Kupon Kodu</th>
                    <th className="px-3 py-3">Kupon Adı</th>
                    <th className="px-3 py-3">Tür</th>
                    <th className="px-3 py-3">İndirim</th>
                    <th className="px-3 py-3">Geçerlilik Tarihi</th>
                    <th className="px-3 py-3">Kullanım</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#94a3b8]">
                        Kupon bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
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
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f0ff] px-2.5 py-1 text-[12px] font-extrabold text-[#2f6bff]">
                            {row.code}
                            <button type="button" aria-label="Kodu kopyala" onClick={() => void copyCode(row.code)}>
                              <Copy className="size-3.5" />
                            </button>
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-bold text-[#0f172a]">{row.name}</p>
                          <p className="mt-0.5 max-w-[220px] truncate text-[12px] text-[#94a3b8]">{row.description || "—"}</p>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${KIND_TONE[row.kind]}`}>{KIND_LABEL[row.kind]}</span>
                        </td>
                        <td className="px-3 py-4 font-semibold text-[#0f172a]">{row.discountLabel}</td>
                        <td className="px-3 py-4 text-[12px] text-[#64748b]">
                          <p>{fmtDate(row.startsAt)}</p>
                          <p>{fmtDate(row.endsAt)}</p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="text-[12px] font-semibold text-[#0f172a]">
                            {row.usedCount.toLocaleString("tr-TR")} / {row.usageLimit == null ? "∞" : row.usageLimit.toLocaleString("tr-TR")}
                          </p>
                          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#eef2f7]">
                            <span className={`block h-full rounded-full ${row.status === "active" ? "bg-[#22c55e]" : "bg-[#cbd5e1]"}`} style={{ width: `${usageRatio(row)}%` }} />
                          </span>
                        </td>
                        <td className={`px-3 py-4 text-[12px] font-bold ${STATUS_TONE[row.status]}`}>{STATUS_LABEL[row.status]}</td>
                        <td className="px-3 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setView(row)}>
                              <Eye className="size-4" />
                            </button>
                            <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setEdit(row)}>
                              <Pencil className="size-4" />
                            </button>
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
                    ))
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
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`inline-flex size-8 items-center justify-center rounded-lg text-[12px] font-bold ${currentPage === n ? "bg-[#2f6bff] text-white" : "border border-[#e8edf3] text-[#475569]"}`}
                  >
                    {n}
                  </button>
                ))}
                <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8edf3] disabled:opacity-40">
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

        <aside className="space-y-4">
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Hızlı İşlemler</h2>
            <ul className="space-y-1">
              <QuickAction icon={Plus} title="Yeni Kupon Oluştur" hint="İndirim kodu tanımlayın" onClick={() => setEdit("new")} />
              <QuickAction
                icon={CopyPlus}
                title="Kupon Kopyala"
                hint="Seçili kuponun kopyasını alın"
                onClick={() => {
                  const row = selectedRows[0] ?? pageRows[0];
                  if (!row) {
                    setNotice("Kopyalamak için bir kupon seçin.");
                    return;
                  }
                  void copyCoupon(row);
                }}
              />
              <QuickAction icon={Layers} title="Toplu Kupon İşlemleri" hint="Seçilileri aktif/pasif yapın" onClick={() => setBulkOpen(true)} />
              <QuickAction icon={FileBarChart2} title="Kupon Kullanım Raporu" hint="CSV olarak indirin" onClick={exportReport} />
            </ul>
          </section>
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Kupon İstatistikleri</h2>
              <span className="rounded-md border border-[#e8edf3] px-2 py-1 text-[11px] font-semibold text-[#64748b]">Bu Ay</span>
            </div>
            <StatLine label="Toplam Kullanım" value={monthStats.usage.toLocaleString("tr-TR")} delta={monthStats.usageDelta} />
            <StatLine label="Toplam İndirim Tutarı" value={`₺${formatPriceTry(monthStats.discount)}`} delta={monthStats.discountDelta} />
            <StatLine label="Ortalama Kullanım" value={monthStats.average.toFixed(1).replace(".", ",")} delta={monthStats.averageDelta} />
            <div className="mt-3 rounded-xl bg-[#f8fafc] p-3">
              <p className="text-[11px] font-bold text-[#94a3b8]">En Çok Kullanılan</p>
              <p className="mt-1 text-[14px] font-extrabold text-[#2f6bff]">{monthStats.topCode}</p>
              <p className="text-[12px] text-[#64748b]">{monthStats.topUsage.toLocaleString("tr-TR")} kullanım</p>
            </div>
          </section>
          <section className="rounded-[18px] border border-[#dbeafe] bg-[#eff6ff] p-4">
            <div className="flex gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-[#2f6bff]" />
              <p className="text-[12px] leading-relaxed text-[#1e40af]">
                Kuponlar sepet ve ödeme sayfasında uygulanır. Kod, tarih ve kullanım limiti sipariş anında tekrar kontrol edilir.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {menu && menuRow ? (
        <FloatingMenu anchor={menu.el} onClose={() => setMenu(null)}>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]"
            onClick={() => {
              setMenu(null);
              void copyCoupon(menuRow);
            }}
          >
            <CopyPlus className="size-3.5" /> Kopyala
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]"
            onClick={() => {
              setMenu(null);
              setSelected(new Set([menuRow.id]));
              void bulk(menuRow.isActive ? "deactivate" : "activate");
            }}
          >
            {menuRow.isActive ? "Devre dışı bırak" : "Aktifleştir"}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#dc2626] hover:bg-[#fef2f2]"
            onClick={() => {
              setMenu(null);
              setRemove(menuRow);
            }}
          >
            <Trash2 className="size-3.5" /> Sil
          </button>
        </FloatingMenu>
      ) : null}
      {edit ? (
        <CouponEditor
          coupon={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            router.refresh();
          }}
        />
      ) : null}
      {view ? <CouponEditor coupon={view} readOnly onClose={() => setView(null)} onSaved={() => setView(null)} /> : null}
      {remove ? (
        <ConfirmDialog
          title="Kuponu sil"
          message={`${remove.code} silinecek. Geçmiş siparişlerdeki kupon kodu kaydı kalır.`}
          confirm="Sil"
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            const res = await fetch(`/api/admin/coupons/${remove.id}/`, { method: "DELETE" });
            if (!res.ok) {
              const data = (await res.json()) as { error?: string };
              setNotice(data.error || "Silinemedi");
              return;
            }
            setRows((current) => current.filter((row) => row.id !== remove.id));
            setRemove(null);
            router.refresh();
          }}
        />
      ) : null}
      {bulkOpen ? (
        <ConfirmDialog
          title="Toplu kupon işlemleri"
          message={`${selected.size} kupon seçili. Aktifleştir, devre dışı bırak veya sil.`}
          extra={
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="h-10 rounded-lg bg-[#22c55e] px-3 text-[13px] font-semibold text-white" onClick={() => void bulk("activate")}>Aktifleştir</button>
              <button type="button" className="h-10 rounded-lg bg-[#64748b] px-3 text-[13px] font-semibold text-white" onClick={() => void bulk("deactivate")}>Devre dışı</button>
              <button type="button" className="h-10 rounded-lg bg-[#dc2626] px-3 text-[13px] font-semibold text-white" onClick={() => void bulk("delete")}>Sil</button>
            </div>
          }
          confirm={null}
          onClose={() => setBulkOpen(false)}
        />
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

function QuickAction({ icon: Icon, title, hint, onClick }: { icon: typeof Plus; title: string; hint: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left hover:bg-[#f8fafc]">
        <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0ff] text-[#2f6bff]">
          <Icon className="size-4" />
        </span>
        <span>
          <span className="block text-[13px] font-bold text-[#0f172a]">{title}</span>
          <span className="block text-[11px] text-[#94a3b8]">{hint}</span>
        </span>
      </button>
    </li>
  );
}

function StatLine({ label, value, delta }: { label: string; value: string; delta: number }) {
  const up = delta >= 0;
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#f1f5f9] py-2.5 last:border-0">
      <div>
        <p className="text-[12px] text-[#64748b]">{label}</p>
        <p className="text-[16px] font-extrabold text-[#0f172a]">{value}</p>
      </div>
      <span className={`text-[11px] font-bold ${up ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
        {up ? "↑" : "↓"} %{pctFmt(delta)}
      </span>
    </div>
  );
}
