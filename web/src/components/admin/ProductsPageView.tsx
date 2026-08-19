"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Box,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  ExternalLink,
  Eye,
  LayoutGrid,
  List,
  Menu,
  MoreVertical,
  Package,
  PackageMinus,
  PackageX,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Tags,
  TrendingDown,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import { DeleteConfirm, ProductEditor, type CatalogCategoryOption } from "@/components/admin/CatalogEditors";
import type { AdminVariant } from "@/components/admin/CatalogCards";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { productPath } from "@/lib/seo/urls";
import { downloadCsv, parseCsv } from "@/lib/admin/csv";

export type ProductsKpi = {
  label: string;
  value: string;
  delta: number;
  color: string;
  icon: "total" | "active" | "inStock" | "outStock" | "lowStock";
};

export type ProductRow = {
  id: number;
  name: string;
  title: string | null;
  sku: string;
  skuGroup: string;
  color: string | null;
  size: string | null;
  price: number;
  vatRate: number;
  stockTotal: number;
  categoryId: number;
  categoryName: string;
  isActive: boolean;
  showOnHomepage: boolean;
  isGroupPrimary: boolean;
  slug: string;
  image: string | null;
  brand: string;
  variantCount: number;
};

export type CategoryShare = {
  id: number;
  name: string;
  count: number;
  percent: number;
  color: string;
};

const KPI_ICONS = {
  total: Package,
  active: ShoppingBag,
  inStock: Box,
  outStock: PackageX,
  lowStock: PackageMinus,
} as const;

const PAGE_SIZES = [10, 25, 50] as const;
const PILL_COLORS = [
  "bg-[#e8f0ff] text-[#2563eb]",
  "bg-[#f1e9ff] text-[#7c3aed]",
  "bg-[#fff4e5] text-[#d97706]",
  "bg-[#e9f9ef] text-[#16a34a]",
  "bg-[#fde8f0] text-[#db2777]",
  "bg-[#e6fbf8] text-[#0f766e]",
];

type TabId = "all" | "stock" | "prices" | "variants" | "extras";

function pctFmt(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

function categoryTone(id: number) {
  return PILL_COLORS[Math.abs(id) % PILL_COLORS.length];
}

function stockClass(stock: number) {
  if (stock <= 0) return "text-[#dc2626]";
  if (stock <= 20) return "text-[#d97706]";
  return "text-[#16a34a]";
}

function toDraft(row: ProductRow): AdminVariant {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    sku: row.sku,
    skuGroup: row.skuGroup,
    color: row.color,
    size: row.size,
    price: row.price,
    vatRate: row.vatRate,
    stockTotal: row.stockTotal,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    isActive: row.isActive,
    showOnHomepage: row.showOnHomepage,
    isGroupPrimary: row.isGroupPrimary,
    slug: row.slug,
    image: row.image,
  };
}

export function ProductsPageView({
  products,
  categories,
  kpis,
  categoryShares,
  lowStockCount,
}: {
  products: ProductRow[];
  categories: CatalogCategoryOption[];
  kpis: ProductsKpi[];
  categoryShares: CategoryShare[];
  lowStockCount: number;
}) {
  const router = useRouter();
  const importRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<TabId>("all");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [edit, setEdit] = useState<AdminVariant | null>(null);
  const [remove, setRemove] = useState<AdminVariant | null>(null);
  const [rows, setRows] = useState(products);
  const [action, setAction] = useState<"create" | "bulk" | "price" | "stock" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const headerSearchRef = useRef<HTMLInputElement>(null);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = minPrice ? Number(minPrice.replace(",", ".")) : null;
    const max = maxPrice ? Number(maxPrice.replace(",", ".")) : null;
    return rows.filter((row) => {
      if (tab === "stock" && row.stockTotal > 20) return false;
      if (tab === "variants" && row.variantCount < 2) return false;
      if (q) {
        const hay = `${row.name} ${row.title ?? ""} ${row.sku} ${row.color ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryId !== "all" && String(row.categoryId) !== categoryId) return false;
      if (status === "active" && !row.isActive) return false;
      if (status === "passive" && row.isActive) return false;
      if (stockFilter === "in" && row.stockTotal <= 0) return false;
      if (stockFilter === "out" && row.stockTotal > 0) return false;
      if (stockFilter === "low" && (row.stockTotal <= 0 || row.stockTotal > 20)) return false;
      if (min != null && Number.isFinite(min) && row.price < min) return false;
      if (max != null && Number.isFinite(max) && row.price > max) return false;
      return true;
    });
  }, [rows, tab, query, categoryId, status, stockFilter, minPrice, maxPrice]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));
  const totalShare = Math.max(1, categoryShares.reduce((sum, item) => sum + item.count, 0));
  const selectedRows = rows.filter((row) => selected.has(row.id));
  const selectedStocks = selectedRows.map((row) => row.stockTotal);
  const currentStock =
    selectedStocks.length > 0 && selectedStocks.every((value) => value === selectedStocks[0])
      ? String(selectedStocks[0])
      : "";
  const selectedPrices = selectedRows.map((row) => Math.round(row.price * 100));
  const currentPrice =
    selectedPrices.length > 0 && selectedPrices.every((value) => value === selectedPrices[0])
      ? (selectedPrices[0] / 100).toFixed(2).replace(".", ",")
      : "";

  const tabs: Array<{ id: TabId; label: string; Icon: typeof Package }> = [
    { id: "all", label: "Tüm Ürünler", Icon: LayoutGrid },
    { id: "stock", label: "Stok Durumu", Icon: Package },
    { id: "prices", label: "Fiyat Listesi", Icon: List },
    { id: "variants", label: "Varyantlı Ürünler", Icon: Tags },
    { id: "extras", label: "Ek Özellikler", Icon: ClipboardList },
  ];

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) pageRows.forEach((row) => next.delete(row.id));
      else pageRows.forEach((row) => next.add(row.id));
      return next;
    });
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setCategoryId("all");
    setStatus("all");
    setStockFilter("all");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
    setNotice("Filtreler temizlendi.");
  }

  function exportCsv() {
    const source = selected.size ? filtered.filter((row) => selected.has(row.id)) : filtered;
    downloadCsv(
      "urunler.csv",
      ["id", "name", "sku", "category", "price", "stock", "active"],
      source.map((row) => [row.id, row.title || row.name, row.sku, row.categoryName, row.price, row.stockTotal, row.isActive]),
    );
    setNotice(`${source.length} ürün dışa aktarıldı.`);
  }

  async function importFile(file: File) {
    const text = await file.text();
    let items: Array<{ sku: string; price?: number; stockTotal?: number; isActive?: boolean }> = [];
    try {
      const json = JSON.parse(text) as unknown;
      if (Array.isArray(json)) items = json as typeof items;
    } catch {
      const table = parseCsv(text);
      const [header, ...rest] = table;
      const idx = (name: string) => header.findIndex((cell) => cell.toLowerCase() === name);
      const skuI = idx("sku") >= 0 ? idx("sku") : 0;
      const priceI = idx("price") >= 0 ? idx("price") : 1;
      const stockI = idx("stock") >= 0 ? idx("stock") : 2;
      const activeI = idx("active") >= 0 ? idx("active") : 3;
      items = rest
        .filter((row) => row[skuI])
        .map((row) => ({
          sku: row[skuI],
          price: row[priceI] ? Number(row[priceI].replace(",", ".")) : undefined,
          stockTotal: row[stockI] ? Number(row[stockI]) : undefined,
          isActive: row[activeI] ? !["0", "false", "pasif"].includes(row[activeI].toLowerCase()) : undefined,
        }));
    }
    if (!items.length) {
      setNotice("Dosyada ürün bulunamadı. Sütunlar: sku;price;stock;active");
      return;
    }
    const res = await fetch("/api/admin/products/import/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = (await res.json()) as { error?: string; updated?: number; missing?: number };
    if (!res.ok) {
      setNotice(data.error || "İçe aktarma başarısız");
      return;
    }
    setNotice(`${data.updated ?? 0} ürün güncellendi${data.missing ? `, ${data.missing} SKU bulunamadı` : ""}.`);
    router.refresh();
  }

  function openBulk(next: "bulk" | "price" | "stock") {
    if (selected.size === 0) {
      setNotice("Önce tablodan ürün seçin.");
      return;
    }
    setNotice(null);
    setAction(next);
  }

  async function postJson(url: string, payload: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(data.error || "İşlem başarısız");
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

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Ürün Yönetimi</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Ürünlerinizi görüntüleyin, stok ve fiyat bilgilerini yönetin.</p>
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
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-4 text-[13px] font-semibold text-[#475569]"
          >
            <ArrowUpFromLine className="size-4" />
            Dışa Aktar
          </button>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-4 text-[13px] font-semibold text-[#475569]"
          >
            <ArrowDownToLine className="size-4" />
            İçe Aktar
          </button>
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setAction("create");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white"
          >
            <Plus className="size-4" />
            Yeni Ürün
          </button>
        </div>
      </div>
      {notice ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{notice}</p> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((card) => {
          const Icon = KPI_ICONS[card.icon];
          const up = card.delta >= 0;
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
                    {up ? "+" : "-"}%{pctFmt(card.delta)} bu hafta
                  </p>
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
              <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2 xl:grid-cols-[1.4fr_0.9fr_0.9fr_0.85fr_0.85fr_1.15fr]">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
                  <div className="relative">
                    <input
                      value={draftQuery}
                      onChange={(e) => setDraftQuery(e.target.value)}
                      placeholder="Ürün adı, SKU, barkod ara..."
                      className="h-11 w-full rounded-lg border border-[#dbe3ee] bg-white px-3 pr-10 text-[13px] outline-none placeholder:text-[#94a3b8]"
                    />
                    <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Kategori</span>
                  <div className="relative">
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setPage(1);
                      }}
                      className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none"
                    >
                      <option value="all">Tümü</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Marka</span>
                  <div className="relative">
                    <select className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none">
                      <option>Tümü</option>
                      <option>Eser Promo</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Durum</span>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
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
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Stok Durumu</span>
                  <div className="relative">
                    <select
                      value={stockFilter}
                      onChange={(e) => {
                        setStockFilter(e.target.value);
                        setPage(1);
                      }}
                      className="h-11 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 pr-9 text-[13px] text-[#64748b] outline-none"
                    >
                      <option value="all">Tümü</option>
                      <option value="in">Stokta Olan</option>
                      <option value="out">Stokta Olmayan</option>
                      <option value="low">Düşük Stok</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <div className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Fiyat Aralığı</span>
                  <div className="flex items-center gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <input
                        value={minPrice}
                        onChange={(e) => {
                          setMinPrice(e.target.value);
                          setPage(1);
                        }}
                        placeholder="Min"
                        className="h-11 w-full rounded-lg border border-[#dbe3ee] bg-white px-3 pr-7 text-[13px] outline-none placeholder:text-[#94a3b8]"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[#94a3b8]">₺</span>
                    </div>
                    <span className="text-[#94a3b8]">-</span>
                    <div className="relative min-w-0 flex-1">
                      <input
                        value={maxPrice}
                        onChange={(e) => {
                          setMaxPrice(e.target.value);
                          setPage(1);
                        }}
                        placeholder="Max"
                        className="h-11 w-full rounded-lg border border-[#dbe3ee] bg-white px-3 pr-7 text-[13px] outline-none placeholder:text-[#94a3b8]"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] text-[#94a3b8]">₺</span>
                    </div>
                  </div>
                </div>
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
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-4 text-[13px] font-medium text-[#475569]"
                  >
                    <RotateCcw className="size-4" />
                    Temizle
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-3.5 text-[13px] font-medium text-[#475569]"
            >
              <SlidersHorizontal className="size-4" />
              Filtreleri Göster
            </button>
          )}

          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="overflow-x-auto border-b border-[#e8edf3]">
              <div className="flex min-w-max items-end gap-7 px-6">
                {tabs.map((item) => {
                  const active = tab === item.id;
                  const Icon = item.Icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTab(item.id);
                        setPage(1);
                      }}
                      className={`-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-[3px] pb-3 pt-4 text-[14px] ${
                        active
                          ? "border-[#2f6bff] font-bold text-[#2f6bff]"
                          : "border-transparent font-medium text-[#64748b] hover:text-[#334155]"
                      }`}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1080px] w-full text-left text-[13px]">
                <thead className="border-b border-[#eef2f7] bg-[#fafbfc] text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                    </th>
                    <th className="px-3 py-3">Ürün</th>
                    <th className="px-3 py-3">Kategori</th>
                    <th className="px-3 py-3">Marka</th>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Fiyat</th>
                    <th className="px-3 py-3">Stok</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#94a3b8]">
                        Ürün bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => {
                      const src = mediaUrl(row.image);
                      return (
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
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-[#f1f5f9]">
                                {src ? (
                                  <Image src={src} alt="" fill className="object-cover" sizes="44px" />
                                ) : (
                                  <Package className="m-2.5 size-6 text-[#94a3b8]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-[#0f172a]">{row.title || row.name}</p>
                                <p className="text-[12px] text-[#94a3b8]">{row.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${categoryTone(row.categoryId)}`}>
                              {row.categoryName}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-[#475569]">{row.brand}</td>
                          <td className="px-3 py-3 font-semibold text-[#334155]">{row.sku}</td>
                          <td className="px-3 py-3 font-extrabold text-[#0f172a]">₺{formatPriceTry(row.price)}</td>
                          <td className={`px-3 py-3 font-extrabold ${stockClass(row.stockTotal)}`}>
                            {row.stockTotal.toLocaleString("tr-TR")}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                row.isActive ? "bg-[#e9f9ef] text-[#16a34a]" : "bg-[#eef2f7] text-[#64748b]"
                              }`}
                            >
                              {row.isActive ? "Aktif" : "Pasif"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={productPath(row.slug)}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
                              >
                                <Eye className="size-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setEdit(toDraft(row))}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
                              >
                                <Pencil className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemove(toDraft(row))}
                                className="inline-flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#eef2f7]"
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

            <div className="flex flex-col gap-3 border-t border-[#eef2f7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-[#94a3b8]">
                {filtered.length.toLocaleString("tr-TR")} kayıttan {filtered.length === 0 ? 0 : start + 1} -{" "}
                {Math.min(start + pageSize, filtered.length)} arası gösteriliyor
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
                {pageCount > 4 ? <span className="px-1 text-[#94a3b8]">...</span> : null}
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

        <aside className="space-y-4">
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[15px] font-extrabold text-[#0f172a]">Hızlı İşlemler</h2>
            <div className="space-y-2">
              {(
                [
                  { id: "create" as const, label: "Yeni Ürün Ekle", Icon: Plus, color: "bg-[#2f6bff]" },
                  { id: "bulk" as const, label: "Toplu Ürün Düzenle", Icon: Pencil, color: "bg-[#22c55e]" },
                  { id: "price" as const, label: "Fiyat Güncelleme", Icon: List, color: "bg-[#f59e0b]" },
                  { id: "stock" as const, label: "Stok Güncelleme", Icon: Package, color: "bg-[#8b5cf6]" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === "create") {
                      setNotice(null);
                      setAction("create");
                      return;
                    }
                    openBulk(item.id);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#edf1f6] bg-white px-3 py-2.5 text-left hover:border-[#2f6bff]/40"
                >
                  <span className={`grid size-9 place-items-center rounded-lg ${item.color} text-white`}>
                    <item.Icon className="size-4" />
                  </span>
                  <span className="text-[13px] font-semibold text-[#0f172a]">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="mb-3 text-[15px] font-extrabold text-[#0f172a]">Kategori Dağılımı</h2>
            <div className="flex items-center gap-4">
              <div
                className="grid size-[120px] shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(${categoryShares
                    .map((item, i) => {
                      const start = categoryShares.slice(0, i).reduce((s, x) => s + (x.count / totalShare) * 100, 0);
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
                {categoryShares.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[#334155]">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="shrink-0 font-bold text-[#0f172a]">
                      %{item.percent} ({item.count})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-[18px] border border-[#fecaca] bg-[#fef2f2] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-[#dc2626]" />
              <div>
                <p className="text-[13px] font-semibold text-[#7f1d1d]">
                  {lowStockCount.toLocaleString("tr-TR")} ürün düşük stok seviyesinde.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTab("stock");
                    setStockFilter("low");
                    setPage(1);
                  }}
                  className="mt-2 text-[12px] font-bold text-[#2f6bff]"
                >
                  Düşük stoklu ürünleri görüntüle →
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {action ? (
        <QuickActionDialog
          action={action}
          categories={categories}
          selectedCount={selected.size}
          currentStock={currentStock}
          currentPrice={currentPrice}
          pending={pending}
          onClose={() => setAction(null)}
          onCreate={async (payload) => {
            setPending(true);
            try {
              await postJson("/api/admin/products/", payload);
              setAction(null);
              router.refresh();
            } catch (error) {
              setNotice(error instanceof Error ? error.message : "Ürün eklenemedi");
            } finally {
              setPending(false);
            }
          }}
          onBulk={async (payload) => {
            setPending(true);
            try {
              await postJson("/api/admin/products/bulk/", { ids: [...selected], ...payload });
              const ids = selected;
              setRows((current) =>
                current.map((row) => {
                  if (!ids.has(row.id)) return row;
                  return {
                    ...row,
                    ...(payload.price !== undefined ? { price: payload.price } : {}),
                    ...(payload.stockTotal !== undefined ? { stockTotal: payload.stockTotal } : {}),
                    ...(payload.categoryId !== undefined
                      ? {
                          categoryId: payload.categoryId,
                          categoryName: categories.find((c) => c.id === payload.categoryId)?.name ?? row.categoryName,
                        }
                      : {}),
                    ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
                    ...(payload.pricePercent !== undefined
                      ? { price: Math.max(0.01, Math.round(row.price * (1 + payload.pricePercent / 100) * 100) / 100) }
                      : {}),
                  };
                }),
              );
              setAction(null);
              setNotice(null);
              router.refresh();
            } catch (error) {
              setNotice(error instanceof Error ? error.message : "Güncelleme başarısız");
            } finally {
              setPending(false);
            }
          }}
        />
      ) : null}

      {edit ? (
        <ProductEditor
          product={edit}
          categories={categories}
          onClose={() => setEdit(null)}
          onSaved={() => setEdit(null)}
        />
      ) : null}
      {remove ? (
        <DeleteConfirm
          title="Ürünü sil"
          message={`${remove.title || remove.name} siteden kalkar.`}
          href={`/api/admin/products/${remove.id}`}
          onClose={() => setRemove(null)}
          onDeleted={() => setRows((current) => current.filter((row) => row.id !== remove.id))}
        />
      ) : null}
    </div>
  );
}

type BulkPayload = {
  price?: number;
  pricePercent?: number;
  stockTotal?: number;
  categoryId?: number;
  isActive?: boolean;
};

function QuickActionDialog({
  action,
  categories,
  selectedCount,
  currentStock,
  currentPrice,
  pending,
  onClose,
  onCreate,
  onBulk,
}: {
  action: "create" | "bulk" | "price" | "stock";
  categories: CatalogCategoryOption[];
  selectedCount: number;
  currentStock: string;
  currentPrice: string;
  pending: boolean;
  onClose: () => void;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
  onBulk: (payload: BulkPayload) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState(action === "bulk" ? "" : String(categories[0]?.id ?? ""));
  const [price, setPrice] = useState(action === "price" ? currentPrice : "");
  const [stock, setStock] = useState(action === "stock" ? currentStock : "0");
  const [percent, setPercent] = useState("");
  const [isActive, setIsActive] = useState("keep");
  const [error, setError] = useState<string | null>(null);

  const title =
    action === "create"
      ? "Yeni Ürün Ekle"
      : action === "bulk"
        ? "Toplu Ürün Düzenle"
        : action === "price"
          ? "Fiyat Güncelleme"
          : "Stok Güncelleme";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (action === "create") {
        const parsedPrice = Number(price.replace(",", "."));
        const parsedStock = Number(stock);
        if (!name.trim() || !sku.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
          setError("Ad, SKU ve fiyat gerekli.");
          return;
        }
        await onCreate({
          name: name.trim(),
          sku: sku.trim(),
          categoryId: Number(categoryId),
          price: parsedPrice,
          stockTotal: Number.isInteger(parsedStock) ? parsedStock : 0,
        });
        return;
      }
      if (action === "bulk") {
        const payload: BulkPayload = {};
        if (categoryId) payload.categoryId = Number(categoryId);
        if (isActive !== "keep") payload.isActive = isActive === "active";
        if (!payload.categoryId && payload.isActive === undefined) {
          setError("Kategori veya durum seçin.");
          return;
        }
        await onBulk(payload);
        return;
      }
      if (action === "price") {
        const parsedPrice = Number(price.replace(",", "."));
        const parsedPercent = Number(percent.replace(",", "."));
        if (price && Number.isFinite(parsedPrice) && parsedPrice >= 0) {
          await onBulk({ price: parsedPrice });
          return;
        }
        if (percent && Number.isFinite(parsedPercent)) {
          await onBulk({ pricePercent: parsedPercent });
          return;
        }
        setError("Sabit fiyat veya yüzde girin.");
        return;
      }
      const parsedStock = Number(stock);
      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        setError("Geçerli stok girin.");
        return;
      }
      await onBulk({ stockTotal: parsedStock });
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-extrabold text-[#0f172a]">{title}</h2>
            {action !== "create" ? (
              <p className="mt-1 text-[12px] text-[#64748b]">{selectedCount} ürün seçili</p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg border border-[#e8edf3]">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          {action === "create" ? (
            <>
              <label className="block text-[13px] font-semibold text-[#334155]">
                Ürün adı
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none" />
              </label>
              <label className="block text-[13px] font-semibold text-[#334155]">
                SKU
                <input value={sku} onChange={(e) => setSku(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none" />
              </label>
            </>
          ) : null}

          {action === "create" || action === "bulk" ? (
            <label className="block text-[13px] font-semibold text-[#334155]">
              Kategori
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none">
                {action === "bulk" ? <option value="">Değiştirme</option> : null}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {action === "bulk" ? (
            <label className="block text-[13px] font-semibold text-[#334155]">
              Durum
              <select value={isActive} onChange={(e) => setIsActive(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none">
                <option value="keep">Değiştirme</option>
                <option value="active">Aktif</option>
                <option value="passive">Pasif</option>
              </select>
            </label>
          ) : null}

          {action === "create" || action === "price" ? (
            <label className="block text-[13px] font-semibold text-[#334155]">
              {action === "price" ? "Sabit fiyat (₺)" : "Fiyat (₺)"}
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={action === "price" && !currentPrice ? "Mevcut fiyatlar farklı" : undefined}
                className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none"
              />
            </label>
          ) : null}

          {action === "price" ? (
            <label className="block text-[13px] font-semibold text-[#334155]">
              veya yüzde değişim
              <input value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="Örn. 10 veya -5" className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none" />
            </label>
          ) : null}

          {action === "create" || action === "stock" ? (
            <label className="block text-[13px] font-semibold text-[#334155]">
              Stok
              <input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder={action === "stock" && !currentStock ? "Mevcut stoklar farklı" : undefined}
                className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 font-normal outline-none"
              />
            </label>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-[13px] text-[#dc2626]">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#dbe3ee] px-4 text-[13px] font-semibold">
            Vazgeç
          </button>
          <button type="submit" disabled={pending} className="h-10 rounded-lg bg-[#2f6bff] px-5 text-[13px] font-semibold text-white disabled:opacity-50">
            {pending ? "Kaydediliyor…" : "Uygula"}
          </button>
        </div>
      </form>
    </div>
  );
}
