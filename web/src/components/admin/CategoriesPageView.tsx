"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Eye,
  Folder,
  FolderOpen,
  GripVertical,
  Layers,
  Menu,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  SquareStack,
  Tags,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { CategoryEditor, DeleteConfirm } from "@/components/admin/CatalogEditors";
import type { CategoryDuplicateGroup } from "@/lib/admin/category-duplicates";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { downloadCsv, parseCsv } from "@/lib/admin/csv";

export type CategoryKpi = {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  color: string;
  icon: "total" | "active" | "passive" | "products";
};

export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  parentName: string | null;
  productCount: number;
  showOnHomepage: boolean;
  sortOrder: number;
  createdAt: string;
};

export type CategoryShare = {
  id: number;
  name: string;
  count: number;
  percent: number;
  color: string;
};

const KPI_ICONS = {
  total: Folder,
  active: SquareStack,
  passive: FolderOpen,
  products: Tags,
} as const;

const PAGE_SIZES = [10, 25, 50] as const;
const CHART_COLORS = ["#2f6bff", "#8b5cf6", "#f59e0b", "#22c55e", "#ec4899", "#14b8a6"];

function pctFmt(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

function flattenCategories(items: CategoryRow[]) {
  const byParent = new Map<number | "root", CategoryRow[]>();
  for (const item of items) {
    const key = item.parentId ?? "root";
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "tr"));
  }
  const rows: Array<CategoryRow & { depth: number }> = [];
  for (const parent of byParent.get("root") ?? []) {
    rows.push({ ...parent, depth: 0 });
    for (const child of byParent.get(parent.id) ?? []) {
      rows.push({ ...child, depth: 1 });
    }
  }
  const seen = new Set(rows.map((row) => row.id));
  for (const item of items) {
    if (!seen.has(item.id)) rows.push({ ...item, depth: item.parentId ? 1 : 0 });
  }
  return rows;
}

export function CategoriesPageView({
  categories,
  duplicateGroups,
  kpis,
  shares,
  recent,
  productTotal,
}: {
  categories: CategoryRow[];
  duplicateGroups: CategoryDuplicateGroup[];
  kpis: CategoryKpi[];
  shares: CategoryShare[];
  recent: CategoryRow[];
  productTotal: number;
}) {
  const router = useRouter();
  const importRef = useRef<HTMLInputElement>(null);
  const filterSearchRef = useRef<HTMLInputElement>(null);
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [parentFilter, setParentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleFilter, setVisibleFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rows, setRows] = useState(categories);
  const [edit, setEdit] = useState<CategoryRow | null>(null);
  const [remove, setRemove] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => setRows(categories), [categories]);

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

  const parents = useMemo(
    () => rows.filter((row) => !row.parentId).sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const subset = rows.filter((row) => {
      if (q && !row.name.toLowerCase().includes(q)) return false;
      if (parentFilter === "root" && row.parentId) return false;
      if (parentFilter !== "all" && parentFilter !== "root") {
        const pid = Number(parentFilter);
        if (row.id !== pid && row.parentId !== pid) return false;
      }
      if (statusFilter === "active" && !row.showOnHomepage) return false;
      if (statusFilter === "passive" && row.showOnHomepage) return false;
      if (visibleFilter === "visible" && !row.showOnHomepage) return false;
      if (visibleFilter === "hidden" && row.showOnHomepage) return false;
      return true;
    });
    return flattenCategories(subset);
  }, [rows, query, parentFilter, statusFilter, visibleFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));
  const totalShare = Math.max(1, shares.reduce((sum, item) => sum + item.count, 0));
  const duplicateCategoryCount = duplicateGroups.reduce((sum, group) => sum + group.items.length, 0);

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setParentFilter("all");
    setStatusFilter("all");
    setVisibleFilter("all");
    setPage(1);
    setNotice("Filtreler temizlendi.");
  }

  function exportCsv() {
    const source = selected.size ? filtered.filter((row) => selected.has(row.id)) : filtered;
    downloadCsv(
      "kategoriler.csv",
      ["id", "name", "parent", "productCount", "visible", "sortOrder", "slug"],
      source.map((row) => [row.id, row.name, row.parentName ?? "", row.productCount, row.showOnHomepage, row.sortOrder, row.slug]),
    );
    setNotice(`${source.length} kategori dışa aktarıldı.`);
  }

  async function importFile(file: File) {
    const text = await file.text();
    let items: Array<{ name: string; parentName?: string | null; sortOrder?: number; visible?: boolean }> = [];
    try {
      const json = JSON.parse(text) as unknown;
      if (Array.isArray(json)) items = json as typeof items;
    } catch {
      const table = parseCsv(text);
      const [header, ...rest] = table;
      const idx = (name: string) => header.findIndex((cell) => cell.toLowerCase() === name);
      const nameI = idx("name") >= 0 ? idx("name") : 0;
      const parentI = idx("parent") >= 0 ? idx("parent") : 1;
      const sortI = idx("sortorder") >= 0 ? idx("sortorder") : 2;
      const visI = idx("visible") >= 0 ? idx("visible") : 3;
      items = rest
        .filter((row) => row[nameI])
        .map((row) => ({
          name: row[nameI],
          parentName: row[parentI] || null,
          sortOrder: Number(row[sortI]) || 0,
          visible: !["0", "false", "gizli", "hayir", "hayır"].includes((row[visI] ?? "true").toLowerCase()),
        }));
    }
    if (!items.length) {
      setNotice("Dosyada kategori bulunamadı. Sütunlar: name;parent;sortOrder;visible");
      return;
    }
    const res = await fetch("/api/admin/categories/import/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = (await res.json()) as { error?: string; created?: number; updated?: number };
    if (!res.ok) {
      setNotice(data.error || "İçe aktarma başarısız");
      return;
    }
    setNotice(`${data.created ?? 0} eklendi, ${data.updated ?? 0} güncellendi.`);
    router.refresh();
  }

  async function toggleVisible(row: CategoryRow) {
    const next = !row.showOnHomepage;
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, showOnHomepage: next } : item)));
    await fetch(`/api/admin/categories/${row.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
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
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-[#e8edf3] px-1.5 py-0.5 text-[10px] font-semibold text-[#94a3b8]">
                ⌘ K
              </span>
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
            </div>
          </div>
        </div>
      </header>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Kategori Yönetimi</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Ürün kategorilerinizi oluşturun, düzenleyin ve sıralayın.</p>
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
          <button type="button" onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-4 text-[13px] font-semibold text-[#475569]">
            <ArrowUpFromLine className="size-4" />
            Dışa Aktar
          </button>
          <button type="button" onClick={() => importRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-4 text-[13px] font-semibold text-[#475569]">
            <ArrowDownToLine className="size-4" />
            İçe Aktar
          </button>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white"
          >
            <Plus className="size-4" />
            Yeni Kategori
          </button>
        </div>
      </div>
      {notice ? <p className="mt-3 text-[13px] font-semibold text-[#2563eb]">{notice}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                  {card.hint ? <p className="mt-2 text-[11px] font-semibold text-[#64748b]">{card.hint}</p> : null}
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          {showFilters ? (
            <section className="rounded-xl border border-[#edf1f6] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
                  <div className="relative">
                    <input
                      ref={filterSearchRef}
                      value={draftQuery}
                      onChange={(e) => setDraftQuery(e.target.value)}
                      placeholder="Kategori adı ile ara..."
                      className="h-11 w-full rounded-lg border border-[#dbe3ee] bg-white px-3 pr-10 text-[13px] outline-none placeholder:text-[#94a3b8]"
                    />
                    <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Üst Kategori</span>
                  <div className="relative">
                    <select
                      value={parentFilter}
                      onChange={(e) => {
                        setParentFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none"
                    >
                      <option value="all">Tümü</option>
                      <option value="root">Ana kategoriler</option>
                      {parents.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Durum</span>
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none"
                    >
                      <option value="all">Tümü</option>
                      <option value="active">Aktif</option>
                      <option value="passive">Pasif</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Görünürlük</span>
                  <div className="relative">
                    <select
                      value={visibleFilter}
                      onChange={(e) => {
                        setVisibleFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none"
                    >
                      <option value="all">Tümü</option>
                      <option value="visible">Görünür</option>
                      <option value="hidden">Gizli</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-3.5 text-[13px] font-medium text-[#475569]"
                >
                  Filtreleri Gizle
                  <ChevronUp className="size-4" />
                </button>
                <div className="flex gap-2.5">
                  <button type="button" onClick={clearFilters} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-4 text-[13px] font-medium text-[#475569]">
                    <RotateCcw className="size-4" />
                    Temizle
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <button type="button" onClick={() => setShowFilters(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-3.5 text-[13px] font-medium text-[#475569]">
              Filtreleri Göster
            </button>
          )}

          <section
            className={`rounded-[18px] border p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ${
              duplicateGroups.length > 0 ? "border-[#fecaca] bg-[#fff7f7]" : "border-[#bbf7d0] bg-[#f0fdf4]"
            }`}
          >
            <div className="flex items-start gap-3">
              {duplicateGroups.length > 0 ? (
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#dc2626]" />
              ) : (
                <SquareStack className="mt-0.5 size-5 shrink-0 text-[#16a34a]" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[15px] font-extrabold text-[#0f172a]">Çift Kategori Kontrolü</h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      duplicateGroups.length > 0 ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#dcfce7] text-[#16a34a]"
                    }`}
                  >
                    {duplicateGroups.length > 0
                      ? `${duplicateGroups.length} grup · ${duplicateCategoryCount} kayıt`
                      : "Temiz"}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#64748b]">
                  {duplicateGroups.length > 0
                    ? "Aynı isimli ve bağlantısız kategoriler aşağıda listelenir. Aynı üst kategori altındaki kayıtlar gerçek çift sayılır."
                    : "Aynı isimli bağlantısız veya aynı üst kategori altında çift kayıt bulunamadı."}
                </p>
              </div>
            </div>

            {duplicateGroups.length > 0 ? (
              <div className="mt-4 space-y-3">
                {duplicateGroups.map((group) => (
                  <article key={group.id} className="overflow-hidden rounded-xl border border-[#fecaca] bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#fee2e2] bg-[#fffafb] px-4 py-3">
                      <div>
                        <p className="text-[14px] font-extrabold text-[#0f172a]">{group.displayName}</p>
                        <p className="mt-1 text-[12px] text-[#64748b]">
                          {group.kind === "same-parent"
                            ? `Aynı üst kategori: ${group.parentName ?? "Ana kategori"}`
                            : "Bağlantısız kategorilerde aynı isim"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          group.kind === "same-parent"
                            ? "bg-[#fee2e2] text-[#dc2626]"
                            : "bg-[#fef3c7] text-[#b45309]"
                        }`}
                      >
                        {group.kind === "same-parent" ? "Gerçek çift" : "Bağlantısız aynı isim"}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-[12px]">
                        <thead className="border-b border-[#eef2f7] bg-[#fafbfc] text-[10px] font-bold tracking-wide text-[#94a3b8] uppercase">
                          <tr>
                            <th className="px-4 py-2">ID</th>
                            <th className="px-3 py-2">Kategori</th>
                            <th className="px-3 py-2">Slug</th>
                            <th className="px-3 py-2">Üst Kategori</th>
                            <th className="px-3 py-2">Ürün</th>
                            <th className="px-3 py-2 text-right">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item) => (
                            <tr key={item.id} className="border-b border-[#eef2f7] last:border-0">
                              <td className="px-4 py-2 font-semibold text-[#475569]">{item.id}</td>
                              <td className="px-3 py-2 font-semibold text-[#0f172a]">{item.name}</td>
                              <td className="px-3 py-2 text-[#64748b]">{item.slug}</td>
                              <td className="px-3 py-2 text-[#64748b]">{item.parentName ?? "Ana kategori"}</td>
                              <td className="px-3 py-2 font-bold text-[#0f172a]">{item.productCount.toLocaleString("tr-TR")}</td>
                              <td className="px-3 py-2">
                                <div className="flex items-center justify-end gap-1">
                                  <Link
                                    href={`/product-category/${item.slug}/`}
                                    className="inline-flex size-7 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
                                  >
                                    <Eye className="size-3.5" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setEdit(item)}
                                    className="inline-flex size-7 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
                                  >
                                    <Pencil className="size-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="border-b border-[#e8edf3] px-6">
              <p className="-mb-px inline-block border-b-[3px] border-[#2f6bff] py-4 text-[14px] font-bold text-[#2f6bff]">
                Kategori Listesi ({filtered.length.toLocaleString("tr-TR")})
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-left text-[13px]">
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
                    <th className="w-8 px-1 py-3" />
                    <th className="px-3 py-3">Kategori Adı</th>
                    <th className="px-3 py-3">Üst Kategori</th>
                    <th className="px-3 py-3">Ürün Sayısı</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3">Görünürlük</th>
                    <th className="px-3 py-3">Sıralama</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#94a3b8]">
                        Kategori bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
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
                        <td className="px-1 py-3 text-[#cbd5e1]">
                          <GripVertical className="size-4" />
                        </td>
                        <td className="px-3 py-3">
                          <div className={`flex items-center gap-2 ${row.depth ? "pl-8" : ""}`}>
                            {row.depth ? (
                              <span className="mr-1 h-px w-4 border-t border-dashed border-[#cbd5e1]" />
                            ) : null}
                            <Folder className="size-4 shrink-0 text-[#94a3b8]" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#0f172a]">{row.name}</p>
                              {!row.parentId ? (
                                <span className="mt-1 inline-flex rounded-full bg-[#e9f9ef] px-2 py-0.5 text-[10px] font-bold text-[#16a34a]">
                                  Ana Kategori
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[#64748b]">{row.parentName ?? "—"}</td>
                        <td className="px-3 py-3 font-extrabold text-[#0f172a]">{row.productCount.toLocaleString("tr-TR")}</td>
                        <td className="px-3 py-3">
                          <span className={`font-semibold ${row.showOnHomepage ? "text-[#16a34a]" : "text-[#d97706]"}`}>
                            {row.showOnHomepage ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => void toggleVisible(row)}
                            className={`font-semibold ${row.showOnHomepage ? "text-[#16a34a]" : "text-[#94a3b8]"}`}
                          >
                            {row.showOnHomepage ? "Görünür" : "Gizli"}
                          </button>
                        </td>
                        <td className="px-3 py-3 text-[#64748b]">{row.sortOrder}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/product-category/${row.slug}/`}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
                            >
                              <Eye className="size-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => setEdit(row)}
                              className="inline-flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setMenuId((id) => (id === row.id ? null : row.id))}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
                              >
                                <MoreVertical className="size-4" />
                              </button>
                              {menuId === row.id ? (
                                <div className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-lg border border-[#e8edf3] bg-white py-1 shadow-lg">
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-1.5 text-left text-[12px] hover:bg-[#f8fafc]"
                                    onClick={() => {
                                      setEdit(row);
                                      setMenuId(null);
                                    }}
                                  >
                                    Düzenle
                                  </button>
                                  <Link
                                    href={`/product-category/${row.slug}/`}
                                    className="block px-3 py-1.5 text-[12px] hover:bg-[#f8fafc]"
                                    onClick={() => setMenuId(null)}
                                  >
                                    Sitede aç
                                  </Link>
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-1.5 text-left text-[12px] text-[#dc2626] hover:bg-[#f8fafc]"
                                    onClick={() => {
                                      setRemove(row);
                                      setMenuId(null);
                                    }}
                                  >
                                    Sil
                                  </button>
                                </div>
                              ) : null}
                            </div>
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
                {filtered.length.toLocaleString("tr-TR")} kayıttan {filtered.length === 0 ? 0 : start + 1} - {Math.min(start + pageSize, filtered.length)} arası gösteriliyor
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex size-8 items-center justify-center rounded-lg border border-[#e8edf3] disabled:opacity-40">
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: Math.min(3, pageCount) }, (_, i) => i + 1).map((n) => (
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
                ))}
                {pageCount > 3 ? (
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
            <h2 className="mb-3 text-[15px] font-extrabold text-[#0f172a]">Kategori Özeti</h2>
            <div className="flex items-center gap-4">
              <div
                className="grid size-[120px] shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(${shares
                    .map((item, i) => {
                      const start = shares.slice(0, i).reduce((s, x) => s + (x.count / totalShare) * 100, 0);
                      const end = start + (item.count / totalShare) * 100;
                      return `${item.color} ${start}% ${end}%`;
                    })
                    .join(", ")})`,
                }}
              >
                <div className="grid size-[72px] place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="text-[16px] font-extrabold leading-none text-[#0f172a]">{totalShare.toLocaleString("tr-TR")}</p>
                    <p className="mt-0.5 text-[10px] text-[#94a3b8]">Toplam</p>
                  </div>
                </div>
              </div>
              <ul className="min-w-0 flex-1 space-y-1.5">
                {shares.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[#334155]">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="shrink-0 font-bold text-[#0f172a]">%{item.percent}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[15px] font-extrabold text-[#0f172a]">Son Eklenen Kategoriler</h2>
            <ul className="space-y-3">
              {recent.map((item, index) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span
                    className="grid size-9 place-items-center rounded-lg text-white"
                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                  >
                    <Layers className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-[#0f172a]">{item.name}</p>
                    <p className="text-[11px] text-[#94a3b8]">{item.parentName ?? "Ana kategori"}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-[11px] text-[#94a3b8]">
                    {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[18px] border border-[#dbeafe] bg-[#eff6ff] p-4">
            <h2 className="text-[14px] font-extrabold text-[#1e3a8a]">Kategori Yönetimi Hakkında</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[#1e40af]">
              Ana kategoriler sitede menü olarak görünür. Alt kategoriler ürün listesini daraltır. Görünürlük ana sayfa vitrinini kontrol eder.
            </p>
            <p className="mt-3 text-[12px] font-bold text-[#2f6bff]">Toplam {productTotal.toLocaleString("tr-TR")} ürün bu kategorilere bağlı.</p>
          </section>
        </aside>
      </div>

      {creating ? (
        <CreateCategoryDialog
          parents={parents}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      ) : null}
      {edit ? (
        <CategoryEditor
          category={edit}
          onClose={() => setEdit(null)}
          onSaved={() => setEdit(null)}
        />
      ) : null}
      {remove ? (
        <DeleteConfirm
          title="Kategoriyi sil"
          message={`${remove.name} ve içindeki ${remove.productCount.toLocaleString("tr-TR")} ürün siteden kalkar.`}
          href={`/api/admin/categories/${remove.id}`}
          onClose={() => setRemove(null)}
          onDeleted={() => setRows((current) => current.filter((row) => row.id !== remove.id))}
        />
      ) : null}
    </div>
  );
}

function CreateCategoryDialog({
  parents,
  onClose,
  onCreated,
}: {
  parents: CategoryRow[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Kategori adı gerekli.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          parentId: parentId ? Number(parentId) : null,
          sortOrder: Number(sortOrder) || 0,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Eklenemedi");
        return;
      }
      onCreated();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-[16px] font-extrabold text-[#0f172a]">Yeni Kategori</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg border border-[#e8edf3]">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block text-[13px] font-semibold text-[#334155]">
            Kategori adı
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none" />
          </label>
          <label className="block text-[13px] font-semibold text-[#334155]">
            Üst kategori
            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none">
              <option value="">Ana kategori</option>
              {parents.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[13px] font-semibold text-[#334155]">
            Sıralama
            <input value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none" />
          </label>
        </div>
        {error ? <p className="mt-3 text-[13px] text-[#dc2626]">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#dbe3ee] px-4 text-[13px] font-semibold">
            Vazgeç
          </button>
          <button type="submit" disabled={pending} className="h-10 rounded-lg bg-[#2f6bff] px-5 text-[13px] font-semibold text-white disabled:opacity-50">
            {pending ? "Kaydediliyor…" : "Ekle"}
          </button>
        </div>
      </form>
    </div>
  );
}
