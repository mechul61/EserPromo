"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Eye,
  Ban,
  Menu,
  Monitor,
  MoreVertical,
  MousePointerClick,
  Pencil,
  Percent,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Smartphone,
  SquareStack,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { PopupEditor } from "@/components/admin/PopupEditor";
import {
  POPUP_AUDIENCE_LABEL,
  POPUP_DEVICE_LABEL,
  POPUP_KIND_LABEL,
  POPUP_PLACEMENT_LABEL,
  POPUP_STATUS_LABEL,
  type PopupKpi,
  type PopupMonthStats,
  type PopupRow,
  type PopupSettings,
  type PopupStatusId,
} from "@/components/admin/popup-types";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { downloadCsv } from "@/lib/admin/csv";
import { conversionRate } from "@/lib/commerce/popups";

const KPI_ICONS = {
  total: SquareStack,
  active: CheckCircle2,
  planned: CalendarClock,
  passive: Ban,
  views: Eye,
} as const;

const PAGE_SIZES = [10, 25, 50] as const;

const KIND_TONE = {
  subscribe: "bg-[#e8f0ff] text-[#2563eb]",
  promo: "bg-[#fff4e5] text-[#d97706]",
  info: "bg-[#e0f2fe] text-[#0284c7]",
} as const;

const STATUS_DOT = {
  active: "bg-[#22c55e]",
  planned: "bg-[#f59e0b]",
  passive: "bg-[#94a3b8]",
  draft: "bg-[#64748b]",
} as const;

type TabId = "all" | PopupStatusId;

function pctFmt(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR");
}

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

export function PopupsPageView({
  popups,
  kpis,
  monthStats,
  settings,
  overallRate,
}: {
  popups: PopupRow[];
  kpis: PopupKpi[];
  monthStats: PopupMonthStats;
  settings: PopupSettings;
  overallRate: number;
}) {
  const router = useRouter();
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [placeFilter, setPlaceFilter] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [tab, setTab] = useState<TabId>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState(popups[0]?.id ?? null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [rows, setRows] = useState(popups);
  const [edit, setEdit] = useState<PopupRow | "new" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setRows(popups);
    if (!previewId && popups[0]) setPreviewId(popups[0].id);
  }, [popups, previewId]);

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
      planned: rows.filter((row) => row.status === "planned").length,
      passive: rows.filter((row) => row.status === "passive").length,
      draft: rows.filter((row) => row.status === "draft").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab !== "all" && row.status !== tab) return false;
      if (q && !`${row.title} ${row.description} ${row.heading}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (kindFilter !== "all" && row.kind !== kindFilter) return false;
      if (placeFilter !== "all" && row.placement !== placeFilter) return false;
      if (deviceFilter !== "all" && row.device !== deviceFilter) return false;
      if (fromDate && row.startsAt && new Date(row.startsAt) < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && row.endsAt && new Date(row.endsAt) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [rows, tab, query, statusFilter, kindFilter, placeFilter, deviceFilter, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));
  const preview = rows.find((row) => row.id === previewId) ?? pageRows[0] ?? null;

  function live(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setStatusFilter("all");
    setKindFilter("all");
    setPlaceFilter("all");
    setDeviceFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function exportCsv() {
    const source = selected.size ? filtered.filter((row) => selected.has(row.id)) : filtered;
    downloadCsv(
      "popuplar.csv",
      ["title", "kind", "placement", "status", "views", "clicks", "conversions"],
      source.map((row) => [row.title, POPUP_KIND_LABEL[row.kind], POPUP_PLACEMENT_LABEL[row.placement], POPUP_STATUS_LABEL[row.status], row.views, row.clicks, row.conversions]),
    );
    setNotice(`${source.length} kayıt dışa aktarıldı.`);
  }

  async function bulk(action: "activate" | "deactivate" | "draft" | "delete", ids?: string[]) {
    const list = ids ?? [...selected];
    if (list.length === 0) {
      setNotice("Önce popup seçin.");
      return;
    }
    const res = await fetch("/api/admin/popups/bulk/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: list, action }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "İşlem başarısız");
      return;
    }
    setSelected(new Set());
    setNotice("Toplu işlem uygulandı.");
    router.refresh();
  }

  async function patchOne(id: string, payload: Record<string, unknown>) {
    await fetch(`/api/admin/popups/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    router.refresh();
  }

  async function remove(row: PopupRow) {
    const res = await fetch(`/api/admin/popups/${row.id}/`, { method: "DELETE" });
    if (!res.ok) {
      setNotice("Silinemedi");
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id));
    router.refresh();
  }

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "all", label: "Tümü", count: counts.all },
    { id: "active", label: "Aktif", count: counts.active },
    { id: "planned", label: "Planlanan", count: counts.planned },
    { id: "passive", label: "Pasif", count: counts.passive },
    { id: "draft", label: "Taslak", count: counts.draft },
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
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Popup Yönetimi</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Sitede gösterilecek popup’ları oluşturun, hedefleyin ve dönüşümlerini takip edin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-4 text-[13px] font-semibold text-[#475569] shadow-sm">
            <Settings className="size-4" />
            Ayarlar
          </button>
          <button type="button" onClick={() => setEdit("new")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
            <Plus className="size-4" />
            Yeni Popup Oluştur
          </button>
        </div>
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
                      {up ? "+" : "-"}%{pctFmt(card.delta)} bu ay
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {showFilters ? (
            <section className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="grid gap-3 lg:grid-cols-6">
                <label className="block min-w-0 lg:col-span-2">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
                  <div className="relative">
                    <input
                      value={draftQuery}
                      onChange={(e) => setDraftQuery(e.target.value)}
                      placeholder="Popup adı..."
                      className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 pr-10 text-[13px] outline-none placeholder:text-[#94a3b8]"
                    />
                    <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <FilterSelect label="Durum" value={statusFilter} onChange={(value) => live(setStatusFilter, value)} options={[["all", "Tümü"], ...Object.entries(POPUP_STATUS_LABEL)]} />
                <FilterSelect label="Tür" value={kindFilter} onChange={(value) => live(setKindFilter, value)} options={[["all", "Tümü"], ...Object.entries(POPUP_KIND_LABEL)]} />
                <FilterSelect label="Gösterim Yeri" value={placeFilter} onChange={(value) => live(setPlaceFilter, value)} options={[["all", "Tümü"], ...Object.entries(POPUP_PLACEMENT_LABEL)]} />
                <FilterSelect label="Cihaz" value={deviceFilter} onChange={(value) => live(setDeviceFilter, value)} options={[["all", "Tümü"], ...Object.entries(POPUP_DEVICE_LABEL)]} />
                <label className="block min-w-0 lg:col-span-2">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Tarih Aralığı</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input type="date" value={fromDate} onChange={(e) => live(setFromDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 pr-8 text-[12px] text-[#64748b] outline-none" />
                      <Calendar className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    </div>
                    <div className="relative">
                      <input type="date" value={toDate} onChange={(e) => live(setToDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 pr-8 text-[12px] text-[#64748b] outline-none" />
                      <Calendar className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    </div>
                  </div>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => setShowFilters(false)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-3.5 text-[13px] font-medium text-[#475569]">
                  Filtreleri Gizle
                  <ChevronUp className="size-4" />
                </button>
                <button type="button" onClick={clearFilters} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-4 text-[13px] font-medium text-[#475569]">
                  <RotateCcw className="size-4" />
                  Temizle
                </button>
              </div>
            </section>
          ) : (
            <button type="button" onClick={() => setShowFilters(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-3.5 text-[13px] font-medium text-[#475569]">
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
            <div className="overflow-x-auto">
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
                    <th className="px-3 py-3">Popup</th>
                    <th className="px-3 py-3">Tür</th>
                    <th className="px-3 py-3">Gösterim Yeri</th>
                    <th className="px-3 py-3">Hedefleme</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3">Görüntüleme</th>
                    <th className="px-3 py-3">Tıklama</th>
                    <th className="px-3 py-3">Dönüşüm</th>
                    <th className="px-3 py-3">Başlangıç / Bitiş</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-[#94a3b8]">Kayıt bulunamadı.</td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`cursor-pointer border-b border-[#f1f5f9] last:border-0 ${previewId === row.id ? "bg-[#f8fbff]" : ""}`}
                        onClick={() => setPreviewId(row.id)}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
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
                          <div className="flex items-center gap-3">
                            <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e8edf3] bg-[#f8fafc]">
                              {row.image ? <Image src={row.image} alt="" fill unoptimized className="object-cover" /> : <SquareStack className="size-5 text-[#94a3b8]" />}
                            </span>
                            <div>
                              <p className="font-bold text-[#0f172a]">{row.title}</p>
                              <p className="max-w-[220px] truncate text-[12px] text-[#94a3b8]">{row.description || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${KIND_TONE[row.kind]}`}>{POPUP_KIND_LABEL[row.kind]}</span>
                        </td>
                        <td className="px-3 py-4 font-semibold text-[#334155]">{POPUP_PLACEMENT_LABEL[row.placement]}</td>
                        <td className="px-3 py-4 text-[12px] text-[#64748b]">{POPUP_AUDIENCE_LABEL[row.audience]}{row.device !== "all" ? ` · ${POPUP_DEVICE_LABEL[row.device]}` : ""}</td>
                        <td className="px-3 py-4">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#334155]">
                            <span className={`size-2 rounded-full ${STATUS_DOT[row.status]}`} />
                            {POPUP_STATUS_LABEL[row.status]}
                          </span>
                        </td>
                        <td className="px-3 py-4 font-semibold">{row.views.toLocaleString("tr-TR")}</td>
                        <td className="px-3 py-4 font-semibold">{row.clicks.toLocaleString("tr-TR")}</td>
                        <td className="px-3 py-4 font-semibold">%{conversionRate(row.views, row.conversions).toFixed(1).replace(".", ",")}</td>
                        <td className="px-3 py-4 text-[12px] text-[#64748b]">
                          <p>{fmtDate(row.startsAt)}</p>
                          <p>{fmtDate(row.endsAt)}</p>
                        </td>
                        <td className="relative px-3 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setPreviewId(row.id)}>
                              <Eye className="size-4" />
                            </button>
                            <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setEdit(row)}>
                              <Pencil className="size-4" />
                            </button>
                            <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setMenuId(menuId === row.id ? null : row.id)}>
                              <MoreVertical className="size-4" />
                            </button>
                          </div>
                          {menuId === row.id ? (
                            <div className="absolute right-3 top-12 z-20 w-40 overflow-hidden rounded-xl border border-[#e8edf3] bg-white py-1 shadow-lg">
                              <button type="button" className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]" onClick={() => { setMenuId(null); void patchOne(row.id, { isActive: row.status !== "active", isDraft: false }); }}>
                                {row.status === "active" ? "Pasifleştir" : "Yayınla"}
                              </button>
                              <button type="button" className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]" onClick={() => { setMenuId(null); void patchOne(row.id, { isDraft: true, isActive: false }); }}>
                                Taslağa al
                              </button>
                              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#dc2626] hover:bg-[#fef2f2]" onClick={() => { setMenuId(null); void remove(row); }}>
                                <Trash2 className="size-3.5" /> Sil
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))
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
              <div className="flex justify-end gap-2">
                {selected.size ? (
                  <button type="button" onClick={() => void bulk("delete")} className="h-8 rounded-lg border border-[#fecaca] px-2 text-[11px] font-semibold text-[#dc2626]">Seçileni sil</button>
                ) : null}
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
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Popup Önizleme</h2>
              <div className="flex overflow-hidden rounded-lg border border-[#e8edf3]">
                <button type="button" onClick={() => setPreviewMode("desktop")} className={`grid size-8 place-items-center ${previewMode === "desktop" ? "bg-[#2f6bff] text-white" : "text-[#94a3b8]"}`}>
                  <Monitor className="size-4" />
                </button>
                <button type="button" onClick={() => setPreviewMode("mobile")} className={`grid size-8 place-items-center ${previewMode === "mobile" ? "bg-[#2f6bff] text-white" : "text-[#94a3b8]"}`}>
                  <Smartphone className="size-4" />
                </button>
              </div>
            </div>
            {preview ? (
              <div className={`mx-auto rounded-2xl bg-[#0b1524] p-4 ${previewMode === "mobile" ? "max-w-[220px]" : ""}`}>
                <PopupPreviewCard popup={preview} compact={previewMode === "mobile"} />
              </div>
            ) : (
              <p className="text-[13px] text-[#94a3b8]">Önizleme için bir satır seçin.</p>
            )}
          </section>

          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Performans Özeti</h2>
            <ul className="space-y-3">
              <Stat icon={Eye} label="Görüntüleme" value={monthStats.views} delta={monthStats.viewsDelta} />
              <Stat icon={MousePointerClick} label="Tıklama" value={monthStats.clicks} delta={monthStats.clicksDelta} />
              <Stat icon={Percent} label="Dönüşüm" value={monthStats.conversions} delta={monthStats.conversionsDelta} />
              <Stat icon={Users} label="Abone" value={monthStats.subscribers} delta={0} hideDelta />
              <li className="flex items-center justify-between text-[12px]">
                <span className="text-[#64748b]">Genel dönüşüm</span>
                <span className="font-extrabold text-[#0f172a]">%{overallRate.toFixed(1).replace(".", ",")}</span>
              </li>
            </ul>
          </section>

          <section className="rounded-[18px] bg-[#eef4ff] p-4">
            <h2 className="text-[13px] font-extrabold text-[#1e3a8a]">Bilgilendirme</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[#334155]">A/B testi için aynı konumda tek aktif popup tutun. Hedeflemeyi cihaz ve ziyaretçi tipine göre daraltırsanız dönüşüm artar.</p>
            <button type="button" onClick={() => setHelpOpen(true)} className="mt-3 text-[12px] font-bold text-[#2f6bff]">Rehberi İncele</button>
          </section>
        </aside>
      </div>

      {edit ? (
        <PopupEditor
          popup={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            router.refresh();
          }}
        />
      ) : null}
      {settingsOpen ? (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onExport={exportCsv}
          onSaved={() => {
            setSettingsOpen(false);
            setNotice("Popup ayarları kaydedildi.");
            router.refresh();
          }}
        />
      ) : null}
      {helpOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between">
              <h2 className="text-[16px] font-extrabold">Popup rehberi</h2>
              <button type="button" onClick={() => setHelpOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-[13px] text-[#334155]">
              <li>Abonelik popup’ı e-posta toplar ve dönüşüm sayar.</li>
              <li>Promosyon popup’ı buton tıklanınca ürün sayfasına gider.</li>
              <li>Aynı ziyaretçiye tekrar gösterme süresini Ayarlar’dan değiştirin.</li>
              <li>Giriş, kayıt, ödeme ve hesap sayfalarında popup gösterilmez.</li>
            </ul>
            <button type="button" onClick={() => { setHelpOpen(false); setEdit("new"); }} className="mt-4 h-10 w-full rounded-lg bg-[#2f6bff] text-[13px] font-semibold text-white">Yeni popup oluştur</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PopupPreviewCard({ popup, compact }: { popup: PopupRow; compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white text-center shadow-lg ${compact ? "p-3" : "p-5"}`}>
      <p className={`font-black tracking-wide text-[#7c3aed] ${compact ? "text-[16px]" : "text-[22px]"}`}>{popup.heading || popup.title}</p>
      <p className={`mt-2 text-[#475569] ${compact ? "text-[10px]" : "text-[13px]"}`}>{popup.body || popup.description || "Kampanya metni"}</p>
      {popup.kind === "subscribe" ? (
        <div className={`mt-3 overflow-hidden rounded-lg border border-[#e8edf3] ${compact ? "h-8" : "h-10"}`}>
          <input readOnly placeholder="E-posta adresiniz" className="h-full w-full px-3 text-left text-[12px] outline-none" />
        </div>
      ) : null}
      <button type="button" className={`mt-3 w-full rounded-lg bg-[#7c3aed] font-bold text-white ${compact ? "h-8 text-[11px]" : "h-10 text-[13px]"}`}>
        {popup.ctaLabel || "Abone Ol"}
      </button>
    </div>
  );
}

function Stat({ icon: Icon, label, value, delta, hideDelta }: { icon: typeof Eye; label: string; value: number; delta: number; hideDelta?: boolean }) {
  const up = delta >= 0;
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2 text-[12px] text-[#64748b]">
        <span className="grid size-8 place-items-center rounded-lg bg-[#f8fafc] text-[#2f6bff]">
          <Icon className="size-4" />
        </span>
        {label}
      </span>
      <span className="text-right">
        <p className="text-[13px] font-extrabold text-[#0f172a]">{value.toLocaleString("tr-TR")}</p>
        {hideDelta ? null : (
          <p className={`text-[10px] font-semibold ${up ? "text-[#16a34a]" : "text-[#dc2626]"}`}>{up ? "+" : "-"}%{pctFmt(delta)}</p>
        )}
      </span>
    </li>
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

function SettingsModal({
  settings,
  onClose,
  onSaved,
  onExport,
}: {
  settings: PopupSettings;
  onClose: () => void;
  onSaved: () => void;
  onExport: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState(settings);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/popups/settings/", {
      method: "PATCH",
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
      <div className="w-full max-w-md rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-extrabold">Popup ayarları</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
        </div>
        <label className="mt-4 flex items-center justify-between gap-3 text-[13px] font-semibold">
          Sitede popup göster
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
        </label>
        <label className="mt-3 block text-[12px] font-bold text-[#334155]">
          Varsayılan gecikme (sn)
          <input type="number" min={0} max={120} value={form.defaultDelay} onChange={(e) => setForm({ ...form, defaultDelay: Number(e.target.value) || 0 })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
        </label>
        <label className="mt-3 block text-[12px] font-bold text-[#334155]">
          Tekrar gösterme (saat)
          <input type="number" min={0} max={8760} value={form.defaultFrequency} onChange={(e) => setForm({ ...form, defaultFrequency: Number(e.target.value) || 0 })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
        </label>
        <button type="button" onClick={onExport} className="mt-4 h-10 w-full rounded-lg border border-[#e8edf3] text-[13px] font-semibold">Listeyi CSV olarak indir</button>
        {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">Vazgeç</button>
          <button type="button" disabled={pending} onClick={() => void save()} className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60">{pending ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
      </div>
    </div>
  );
}
