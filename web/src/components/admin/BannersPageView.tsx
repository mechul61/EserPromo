"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpFromLine,
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Eye,
  FileImage,
  LayoutGrid,
  Layers,
  MapPin,
  Menu,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { BannerEditor } from "@/components/admin/BannerEditor";
import {
  BANNER_KIND_LABEL,
  BANNER_PLACEMENT_LABEL,
  bannerAmountLabel,
  type BannerKpi,
  type BannerPlacementId,
  type BannerRow,
  type BannerShare,
} from "@/components/admin/banner-types";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { FloatingMenu } from "@/components/admin/FloatingMenu";
import { SITE_CONTACT } from "@/data/catalog-page";
import { downloadCsv } from "@/lib/admin/csv";

const KPI_ICONS = {
  total: FileImage,
  slider: SlidersHorizontal,
  active: LayoutGrid,
  passive: Layers,
  views: Eye,
} as const;

const PAGE_SIZES = [10, 25, 50] as const;

const PLACE_TONE: Record<BannerPlacementId, string> = {
  hero: "bg-[#e8f0ff] text-[#2563eb]",
  middle_1: "bg-[#f1e9ff] text-[#7c3aed]",
  middle_2: "bg-[#fff4e5] text-[#d97706]",
  bottom: "bg-[#fff8e1] text-[#ca8a04]",
  side: "bg-[#e6fbf8] text-[#0f766e]",
  category: "bg-[#e9f9ef] text-[#16a34a]",
};

function pctFmt(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

function fmtRange(start: string | null, end: string | null) {
  const a = start ? new Date(start).toLocaleDateString("tr-TR") : "—";
  const b = end ? new Date(end).toLocaleDateString("tr-TR") : "—";
  return `${a} – ${b}`;
}

export function BannersPageView({
  banners,
  kpis,
  shares,
}: {
  banners: BannerRow[];
  kpis: BannerKpi[];
  shares: BannerShare[];
}) {
  const router = useRouter();
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState("all");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [tab, setTab] = useState<"banner" | "slider">("banner");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [rows, setRows] = useOptimistic(banners);
  const [edit, setEdit] = useState<BannerRow | "new" | "slider" | null>(null);
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
    setPreviewId(null);
  }, [tab]);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab === "banner" && row.kind !== "banner") return false;
      if (tab === "slider" && row.kind !== "slider") return false;
      if (q && !`${row.title} ${row.href} ${BANNER_PLACEMENT_LABEL[row.placement]}`.toLowerCase().includes(q)) return false;
      if (placement !== "all" && row.placement !== placement) return false;
      if (status === "active" && !row.isActive) return false;
      if (status === "passive" && row.isActive) return false;
      if (fromDate && row.startsAt && new Date(row.startsAt) < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && row.endsAt && new Date(row.endsAt) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [rows, tab, query, placement, status, fromDate, toDate]);

  const counts = useMemo(
    () => ({
      banner: rows.filter((row) => row.kind === "banner").length,
      slider: rows.filter((row) => row.kind === "slider").length,
    }),
    [rows],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));
  const menuRow = menu ? rows.find((row) => row.id === menu.id) : null;
  const preview = useMemo(() => {
    if (!filtered.length) return null;
    if (previewId) {
      const hit = filtered.find((row) => row.id === previewId);
      if (hit) return hit;
    }
    return filtered[0];
  }, [filtered, previewId]);
  const distTotal = Math.max(1, shares.reduce((sum, item) => sum + item.count, 0));

  const previewIndex = preview ? filtered.findIndex((row) => row.id === preview.id) : -1;

  function stepPreview(dir: number) {
    if (!filtered.length) return;
    const current = previewIndex >= 0 ? previewIndex : 0;
    const next = filtered[(current + dir + filtered.length) % filtered.length];
    setPreviewId(next.id);
  }

  function live(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setPlacement("all");
    setStatus("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function exportCsv() {
    const source = selected.size ? filtered.filter((row) => selected.has(row.id)) : filtered;
    downloadCsv(
      "bannerlar.csv",
      ["title", "kind", "placement", "active", "amount", "href", "views", "sortOrder"],
      source.map((row) => [
        row.title,
        row.kind,
        BANNER_PLACEMENT_LABEL[row.placement],
        row.isActive,
        bannerAmountLabel(row.minAmount, row.maxAmount),
        row.href,
        row.views,
        row.sortOrder,
      ]),
    );
    setNotice(`${source.length} kayıt dışa aktarıldı.`);
  }

  async function bulk(action: "activate" | "deactivate" | "delete", ids?: string[]) {
    const list = ids ?? [...selected];
    if (list.length === 0) {
      setNotice("Önce banner seçin.");
      return;
    }
    const res = await fetch("/api/admin/banners/bulk/", {
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

  async function patchSort(row: BannerRow, sortOrder: number) {
    await fetch(`/api/admin/banners/${row.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder }),
    });
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, sortOrder } : item)));
  }

  async function remove(row: BannerRow) {
    const res = await fetch(`/api/admin/banners/${row.id}/`, { method: "DELETE" });
    if (!res.ok) {
      setNotice("Silinemedi");
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id));
    router.refresh();
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
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Banner & Slider Yönetimi</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Web sitenizde görüntülenecek banner ve slider içeriklerini oluşturun, düzenleyin ve yönetin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-4 text-[13px] font-semibold text-[#475569] shadow-sm">
            <ArrowUpFromLine className="size-4" />
            Dışa Aktar
          </button>
          <button type="button" onClick={() => setEdit(tab === "slider" ? "slider" : "new")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
            <Plus className="size-4" />
            {tab === "slider" ? "Yeni Slider Ekle" : "Yeni Banner Ekle"}
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
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex gap-5 border-b border-[#e8edf3]">
              {([
                ["banner", "Bannerlar", counts.banner],
                ["slider", "Sliderlar", counts.slider],
              ] as const).map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id);
                    setPage(1);
                  }}
                  className={`-mb-px border-b-[3px] py-3 text-[14px] font-bold ${tab === id ? "border-[#2f6bff] text-[#2f6bff]" : "border-transparent text-[#94a3b8]"}`}
                >
                  {label} ({count.toLocaleString("tr-TR")})
                </button>
              ))}
            </div>
            {showFilters ? (
              <>
                <div className="grid gap-3 lg:grid-cols-5">
                  <label className="block min-w-0">
                    <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
                    <div className="relative">
                      <input
                        value={draftQuery}
                        onChange={(e) => setDraftQuery(e.target.value)}
                        placeholder={tab === "slider" ? "Slider adı..." : "Banner adı..."}
                        className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 pr-10 text-[13px] outline-none placeholder:text-[#94a3b8]"
                      />
                      <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    </div>
                  </label>
                  <FilterSelect
                    label="Konum"
                    value={placement}
                    onChange={(value) => live(setPlacement, value)}
                    options={[["all", "Tümü"], ...Object.entries(BANNER_PLACEMENT_LABEL)]}
                  />
                  <FilterSelect label="Durum" value={status} onChange={(value) => live(setStatus, value)} options={[["all", "Tümü"], ["active", "Aktif"], ["passive", "Pasif"]]} />
                  <FieldDate label="Başlangıç Tarihi" value={fromDate} onChange={(value) => live(setFromDate, value)} />
                  <FieldDate label="Bitiş Tarihi" value={toDate} onChange={(value) => live(setToDate, value)} />
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
              </>
            ) : (
              <button type="button" onClick={() => setShowFilters(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] px-3.5 text-[13px] font-medium text-[#475569]">
                Filtreleri Göster
              </button>
            )}
          </section>

          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
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
                    <th className="px-3 py-3">{tab === "slider" ? "Slider" : "Banner"}</th>
                    <th className="px-3 py-3">Konum</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3">Tarih Aralığı</th>
                    <th className="px-3 py-3">Para Sınırı</th>
                    <th className="px-3 py-3">Görüntülenme</th>
                    <th className="px-3 py-3">Sıralama</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#94a3b8]">
                        {tab === "slider"
                          ? "Henüz slider kaydı yok. Sağdaki \"Yeni Slider\" veya üstteki \"Yeni Slider Ekle\" ile ekleyebilirsiniz."
                          : "Henüz banner kaydı yok. \"Yeni Banner Ekle\" ile ekleyebilirsiniz."}
                      </td>
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
                            <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-[#e8edf3] bg-[#f8fafc]">
                              <Image src={row.image} alt="" fill unoptimized className="object-cover" />
                            </span>
                            <div>
                              <p className="font-bold text-[#0f172a]">{row.title}</p>
                              <p className="text-[12px] text-[#94a3b8]">
                                {BANNER_KIND_LABEL[row.kind]} · {row.width} x {row.height}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${PLACE_TONE[row.placement]}`}>
                            {BANNER_PLACEMENT_LABEL[row.placement]}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${row.isActive ? "bg-[#e9f9ef] text-[#16a34a]" : "bg-[#fde8f0] text-[#dc2626]"}`}>
                            {row.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-[12px] text-[#64748b]">{fmtRange(row.startsAt, row.endsAt)}</td>
                        <td className="px-3 py-4 text-[12px] font-semibold text-[#334155]">{bannerAmountLabel(row.minAmount, row.maxAmount)}</td>
                        <td className="px-3 py-4 font-semibold">{row.views.toLocaleString("tr-TR")}</td>
                        <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            value={row.sortOrder}
                            onChange={(e) => void patchSort(row, Number(e.target.value) || 0)}
                            className="h-8 w-14 rounded-lg border border-[#e8edf3] px-2 text-center text-[13px] outline-none"
                          />
                        </td>
                        <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setPreviewId(row.id)}>
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
            <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">
              Seçilen {tab === "slider" ? "Slider" : "Banner"} Önizleme
            </h2>
            {preview ? (
              <>
                <div className="relative h-40 overflow-hidden rounded-xl bg-[#1d4ed8]">
                  <Image src={preview.image} alt="" fill unoptimized className="object-cover" />
                  {filtered.length > 1 ? (
                    <>
                      <button type="button" onClick={() => stepPreview(-1)} className="absolute left-2 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#334155] shadow">
                        <ChevronLeft className="size-4" />
                      </button>
                      <button type="button" onClick={() => stepPreview(1)} className="absolute right-2 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#334155] shadow">
                        <ChevronRight className="size-4" />
                      </button>
                      <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1">
                        {filtered.slice(0, 8).map((row) => (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => setPreviewId(row.id)}
                            className={`h-1.5 rounded-full ${preview.id === row.id ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                  <div><dt className="text-[#94a3b8]">Tür</dt><dd className="font-semibold">{BANNER_KIND_LABEL[preview.kind]}</dd></div>
                  <div><dt className="text-[#94a3b8]">Konum</dt><dd className="font-semibold">{BANNER_PLACEMENT_LABEL[preview.placement]}</dd></div>
                  <div><dt className="text-[#94a3b8]">Durum</dt><dd className="font-semibold">{preview.isActive ? "Aktif" : "Pasif"}</dd></div>
                  <div className="col-span-2"><dt className="text-[#94a3b8]">Tarih Aralığı</dt><dd className="font-semibold">{fmtRange(preview.startsAt, preview.endsAt)}</dd></div>
                  <div className="col-span-2"><dt className="text-[#94a3b8]">Para Sınırı</dt><dd className="font-semibold">{bannerAmountLabel(preview.minAmount, preview.maxAmount)}</dd></div>
                  <div><dt className="text-[#94a3b8]">Görüntülenme</dt><dd className="font-semibold">{preview.views.toLocaleString("tr-TR")}</dd></div>
                  <div><dt className="text-[#94a3b8]">Sıralama</dt><dd className="font-semibold">{preview.sortOrder}</dd></div>
                </dl>
              </>
            ) : (
              <p className="text-[13px] text-[#94a3b8]">
                {tab === "slider" ? "Slider sekmesinde önizlenecek kayıt yok." : "Banner sekmesinde önizlenecek kayıt yok."}
              </p>
            )}
          </section>

          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Hızlı İşlemler</h2>
            <div className="grid grid-cols-4 gap-2">
              <Quick icon={Plus} label="Yeni Banner Ekle" tone="bg-[#e8f0ff] text-[#2f6bff]" onClick={() => setEdit("new")} />
              <Quick icon={SlidersHorizontal} label="Slider Yönetimi" tone="bg-[#f1e9ff] text-[#7c3aed]" onClick={() => { setTab("slider"); setPage(1); }} />
              <Quick icon={MapPin} label="Konum Yönetimi" tone="bg-[#fff4e5] text-[#d97706]" onClick={() => setNotice("Konumlar: Ana Sayfa Hero, Orta, Alt, Yan ve Kategori alanları.")} />
              <Quick icon={Settings2} label="Toplu Düzenle" tone="bg-[#e6fbf8] text-[#0f766e]" onClick={() => void bulk("activate")} />
              <Quick icon={LayoutGrid} label="Tümünü Aktif" tone="bg-[#e9f9ef] text-[#16a34a]" onClick={() => void bulk("activate", filtered.map((row) => row.id))} />
              <Quick icon={Layers} label="Tümünü Pasif" tone="bg-[#fff4e5] text-[#d97706]" onClick={() => void bulk("deactivate", filtered.map((row) => row.id))} />
              <Quick icon={ArrowUpFromLine} label="Dışa Aktar" tone="bg-[#e8f0ff] text-[#2f6bff]" onClick={exportCsv} />
              <Quick icon={FileImage} label="Yeni Slider" tone="bg-[#fde8f0] text-[#db2777]" onClick={() => setEdit("slider")} />
            </div>
          </section>

          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[15px] font-extrabold text-[#0f172a]">Konum Dağılımı</h2>
            <div className="flex items-center gap-4">
              <div
                className="grid size-[120px] shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(${shares
                    .map((item, i) => {
                      const startPct = shares.slice(0, i).reduce((s, x) => s + (x.count / distTotal) * 100, 0);
                      const end = startPct + (item.count / distTotal) * 100;
                      return `${item.color} ${startPct}% ${end}%`;
                    })
                    .join(", ")})`,
                }}
              >
                <div className="grid size-[72px] place-items-center rounded-full bg-white text-center">
                  <p className="text-[16px] font-extrabold leading-none text-[#0f172a]">{counts.banner + counts.slider}</p>
                  <p className="text-[10px] text-[#94a3b8]">Toplam</p>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-1.5">
                {shares.filter((item) => item.count > 0).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-bold">%{item.percent} · {item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </aside>
      </div>

      {menu && menuRow ? (
        <FloatingMenu anchor={menu.el} onClose={() => setMenu(null)}>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]"
            onClick={() => {
              setMenu(null);
              void fetch(`/api/admin/banners/${menuRow.id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !menuRow.isActive }),
              }).then(() => router.refresh());
            }}
          >
            {menuRow.isActive ? "Pasifleştir" : "Aktifleştir"}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#dc2626] hover:bg-[#fef2f2]"
            onClick={() => {
              setMenu(null);
              void remove(menuRow);
            }}
          >
            <Trash2 className="size-3.5" /> Sil
          </button>
        </FloatingMenu>
      ) : null}

      {edit ? (
        <BannerEditor
          banner={edit === "new" || edit === "slider" ? null : edit}
          defaultKind={edit === "slider" ? "slider" : "banner"}
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

function Quick({ icon: Icon, label, onClick, tone }: { icon: typeof Plus; label: string; onClick: () => void; tone: string }) {
  return (
    <button type="button" onClick={onClick} className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl bg-[#f8fafc] px-1 text-center hover:bg-[#eef4ff]">
      <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>
        <Icon className="size-4" />
      </span>
      <span className="text-[9px] font-bold leading-tight text-[#334155]">{label}</span>
    </button>
  );
}
