"use client";

import Link from "next/link";
import { useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  FileSpreadsheet,
  Mail,
  Menu,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Tags,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { ConfirmDialog, CustomerEditor } from "@/components/admin/CustomerEditor";
import { FloatingMenu } from "@/components/admin/FloatingMenu";
import type {
  CustomerGroupId,
  CustomerKpi,
  CustomerRow,
  CustomerShare,
  CustomerSourceShare,
  CustomerStatus,
  TopSpender,
} from "@/components/admin/customer-types";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { downloadCsv, parseCsv } from "@/lib/admin/csv";
import { formatPriceTry } from "@/lib/media";

const KPI_ICONS = {
  total: Users,
  active: UserRound,
  new: UserPlus,
  orders: ShoppingBag,
  spend: Wallet,
} as const;

const PAGE_SIZES = [10, 25, 50] as const;
const AVATAR = ["bg-[#2f6bff]", "bg-[#8b5cf6]", "bg-[#f59e0b]", "bg-[#22c55e]", "bg-[#ec4899]", "bg-[#14b8a6]"];

const GROUP_LABEL: Record<CustomerGroupId, string> = {
  retail: "Perakende",
  wholesale: "Toptan",
  vip: "VIP",
};

const GROUP_TONE: Record<CustomerGroupId, string> = {
  retail: "bg-[#e8f0ff] text-[#2563eb]",
  wholesale: "bg-[#fff4e5] text-[#d97706]",
  vip: "bg-[#f1e9ff] text-[#7c3aed]",
};

const STATUS_LABEL: Record<CustomerStatus, string> = {
  active: "Aktif",
  passive: "Pasif",
  blocked: "Engelli",
};

const STATUS_TONE: Record<CustomerStatus, string> = {
  active: "bg-[#e9f9ef] text-[#16a34a]",
  passive: "bg-[#eef2f7] text-[#64748b]",
  blocked: "bg-[#fde8f0] text-[#dc2626]",
};

type TabId = "all" | "active" | "new" | "vip" | "passive" | "blocked";

function pctFmt(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "M";
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

export function CustomersPageView({
  customers,
  kpis,
  shares,
  sources,
  topSpenders,
  cities,
}: {
  customers: CustomerRow[];
  kpis: CustomerKpi[];
  shares: CustomerShare[];
  sources: CustomerSourceShare[];
  topSpenders: TopSpender[];
  cities: string[];
}) {
  const router = useRouter();
  const importRef = useRef<HTMLInputElement>(null);
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(true);
  const [tab, setTab] = useState<TabId>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rows] = useOptimistic(customers);
  const [edit, setEdit] = useState<CustomerRow | "new" | null>(null);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [segmentGroup, setSegmentGroup] = useState<CustomerGroupId>("vip");
  const [menu, setMenu] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [spendFocus, setSpendFocus] = useState(false);

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
      new: rows.filter((row) => row.isNew).length,
      vip: rows.filter((row) => row.customerGroup === "vip").length,
      passive: rows.filter((row) => row.status === "passive").length,
      blocked: rows.filter((row) => row.status === "blocked").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (tab === "active" && row.status !== "active") return false;
      if (tab === "new" && !row.isNew) return false;
      if (tab === "vip" && row.customerGroup !== "vip") return false;
      if (tab === "passive" && row.status !== "passive") return false;
      if (tab === "blocked" && row.status !== "blocked") return false;
      if (q && ![row.name, row.email, row.phone, String(row.publicNo), row.city].join(" ").toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (groupFilter !== "all" && row.customerGroup !== groupFilter) return false;
      if (cityFilter !== "all" && row.city !== cityFilter) return false;
      if (fromDate && new Date(row.createdAt) < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && new Date(row.createdAt) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
    if (spendFocus) return [...list].sort((a, b) => b.spend - a.spend);
    return list;
  }, [rows, tab, query, statusFilter, groupFilter, cityFilter, fromDate, toDate, spendFocus]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));
  const menuRow = menu ? rows.find((row) => row.id === menu.id) : null;
  const distTotal = Math.max(1, shares.reduce((sum, item) => sum + item.count, 0));

  function setLiveFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setStatusFilter("all");
    setGroupFilter("all");
    setFromDate("");
    setToDate("");
    setCityFilter("all");
    setSpendFocus(false);
    setPage(1);
    setNotice("Filtreler temizlendi.");
  }

  function exportCsv() {
    const source = selected.size ? filtered.filter((row) => selected.has(row.id)) : filtered;
    downloadCsv(
      "musteriler.csv",
      ["publicNo", "name", "email", "phone", "city", "group", "source", "orders", "spend", "status", "createdAt"],
      source.map((row) => [
        row.publicNo,
        row.name,
        row.email,
        row.phone,
        row.city,
        GROUP_LABEL[row.customerGroup],
        row.source,
        row.orderCount,
        row.spend,
        STATUS_LABEL[row.status],
        row.createdAt,
      ]),
    );
    setNotice(`${source.length} müşteri dışa aktarıldı.`);
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
      const nameI = idx("name") >= 0 ? idx("name") : 0;
      const emailI = idx("email") >= 0 ? idx("email") : 1;
      const phoneI = idx("phone") >= 0 ? idx("phone") : 2;
      const groupI = idx("group") >= 0 ? idx("group") : 3;
      const cityI = idx("city") >= 0 ? idx("city") : 4;
      const sourceI = idx("source") >= 0 ? idx("source") : 5;
      const activeI = idx("active") >= 0 ? idx("active") : 6;
      items = rest
        .filter((row) => row[nameI] && row[emailI])
        .map((row) => ({
          name: row[nameI],
          email: row[emailI],
          phone: row[phoneI] || "",
          customerGroup: row[groupI] || "retail",
          city: row[cityI] || "",
          source: row[sourceI] || "website",
          isActive: row[activeI] ? !["0", "false", "pasif"].includes(row[activeI].toLowerCase()) : true,
        }));
    }
    if (!items.length) {
      setNotice("Dosyada müşteri bulunamadı. Sütunlar: name;email;phone;group;city;source;active");
      return;
    }
    const res = await fetch("/api/admin/users/import/", {
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

  async function bulk(action: "activate" | "deactivate" | "block" | "unblock" | "group", group?: CustomerGroupId) {
    if (selected.size === 0) {
      setNotice("Önce tablodan müşteri seçin.");
      return;
    }
    const res = await fetch("/api/admin/users/bulk/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...selected], action, customerGroup: group }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "Toplu işlem başarısız");
      return;
    }
    setSegmentOpen(false);
    setNotice("Toplu işlem uygulandı.");
    router.refresh();
  }

  async function patchOne(row: CustomerRow, payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/users/${row.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "Güncellenemedi");
      return;
    }
    router.refresh();
  }

  function sendEmail() {
    const list = (selected.size ? rows.filter((row) => selected.has(row.id)) : filtered).map((row) => row.email);
    if (!list.length) {
      setNotice("E-posta göndermek için müşteri seçin.");
      return;
    }
    void navigator.clipboard.writeText(list.join("; "));
    window.location.href = `mailto:?bcc=${encodeURIComponent(list.join(","))}`;
    setNotice(`${list.length} e-posta panoya kopyalandı.`);
  }

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "all", label: "Tüm Müşteriler", count: counts.all },
    { id: "active", label: "Aktif", count: counts.active },
    { id: "new", label: "Yeni", count: counts.new },
    { id: "vip", label: "VIP", count: counts.vip },
    { id: "passive", label: "Pasif", count: counts.passive },
    { id: "blocked", label: "Engelli", count: counts.blocked },
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
                placeholder="Arama yapın..."
                className="h-11 w-full rounded-2xl border border-[#e8edf3] bg-[#f8fafc] pl-11 pr-14 text-[13px] outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const value = e.currentTarget.value;
                    setDraftQuery(value);
                    setQuery(value);
                    setPage(1);
                  }
                }}
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
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Müşteri Yönetimi</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Müşterilerinizi görüntüleyin, segmentlere ayırın ve iletişim bilgilerini yönetin.</p>
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
          <button type="button" onClick={() => setEdit("new")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
            <Plus className="size-4" />
            Yeni Müşteri
          </button>
        </div>
      </div>
      {notice ? <p className="mt-3 text-[13px] font-semibold text-[#2563eb]">{notice}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
                    <TrendingUp className="size-3.5" />
                    {up ? "↑" : "↓"} %{pctFmt(card.delta)} bu hafta
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
            <section className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="grid gap-3 lg:grid-cols-5">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
                  <div className="relative">
                    <input
                      value={draftQuery}
                      onChange={(e) => setDraftQuery(e.target.value)}
                      placeholder="Ad, e-posta veya telefon..."
                      className="h-11 w-full rounded-lg border border-[#dbe3ee] bg-white px-3 pr-10 text-[13px] outline-none placeholder:text-[#94a3b8]"
                    />
                    <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <FilterSelect label="Durum" value={statusFilter} onChange={(value) => setLiveFilter(setStatusFilter, value)} options={[["all", "Tümü"], ["active", "Aktif"], ["passive", "Pasif"], ["blocked", "Engelli"]]} />
                <FilterSelect label="Grup" value={groupFilter} onChange={(value) => setLiveFilter(setGroupFilter, value)} options={[["all", "Tümü"], ["retail", "Perakende"], ["wholesale", "Toptan"], ["vip", "VIP"]]} />
                <div className="min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Kayıt Tarihi</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={fromDate} onChange={(e) => setLiveFilter(setFromDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 text-[12px] text-[#64748b] outline-none" />
                    <input type="date" value={toDate} onChange={(e) => setLiveFilter(setToDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 text-[12px] text-[#64748b] outline-none" />
                  </div>
                </div>
                <FilterSelect label="Şehir" value={cityFilter} onChange={(value) => setLiveFilter(setCityFilter, value)} options={[["all", "Tümü"], ...cities.map((city) => [city, city] as [string, string])]} />
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
                    setSpendFocus(false);
                    setPage(1);
                  }}
                  className={`-mb-px border-b-[3px] py-4 text-[13px] font-bold ${tab === item.id ? "border-[#2f6bff] text-[#2f6bff]" : "border-transparent text-[#94a3b8]"}`}
                >
                  {item.label} ({item.count.toLocaleString("tr-TR")})
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-[13px]">
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
                    <th className="px-3 py-3">Müşteri</th>
                    <th className="px-3 py-3">İletişim Bilgileri</th>
                    <th className="px-3 py-3">Grup</th>
                    <th className="px-3 py-3">Sipariş Sayısı</th>
                    <th className="px-3 py-3">Toplam Harcama</th>
                    <th className="px-3 py-3">Kayıt Tarihi</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#94a3b8]">
                        Müşteri bulunamadı.
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
                          <div className="flex items-center gap-3">
                            <span className={`grid size-10 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-white ${AVATAR[row.publicNo % AVATAR.length]}`}>
                              {initials(row.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-[#0f172a]">{row.name}</p>
                              <p className="text-[12px] text-[#94a3b8]">#{row.publicNo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="break-all text-[#0f172a]">{row.email}</p>
                          <p className="mt-0.5 text-[12px] text-[#94a3b8]">{row.phone}</p>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${GROUP_TONE[row.customerGroup]}`}>
                            {GROUP_LABEL[row.customerGroup]}
                          </span>
                        </td>
                        <td className="px-3 py-4 font-semibold">{row.orderCount.toLocaleString("tr-TR")}</td>
                        <td className="px-3 py-4 font-extrabold text-[#0f172a]">₺{formatPriceTry(row.spend)}</td>
                        <td className="px-3 py-4 text-[12px] text-[#64748b]">{fmtWhen(row.createdAt)}</td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_TONE[row.status]}`}>
                            {STATUS_LABEL[row.status]}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/admin/musteriler/${row.id}`} className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]">
                              <Eye className="size-4" />
                            </Link>
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
            <h2 className="mb-3 text-[15px] font-extrabold text-[#0f172a]">Müşteri Dağılımı</h2>
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
                  <div>
                    <p className="text-[16px] font-extrabold leading-none text-[#0f172a]">{rows.length.toLocaleString("tr-TR")}</p>
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
            <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Hızlı İşlemler</h2>
            <ul className="space-y-1">
              <QuickAction icon={UserPlus} title="Yeni Müşteri Ekle" hint="Manuel olarak müşteri tanımlayın" onClick={() => setEdit("new")} />
              <QuickAction icon={FileSpreadsheet} title="Toplu Müşteri Yükle" hint="CSV veya Excel benzeri dosya" onClick={() => importRef.current?.click()} />
              <QuickAction icon={Tags} title="Segment Oluştur" hint="Seçilileri VIP / Toptan yapın" onClick={() => setSegmentOpen(true)} />
              <QuickAction icon={Mail} title="E-posta Gönder" hint="Seçili müşterilere toplu e-posta" onClick={sendEmail} />
            </ul>
          </section>
        </aside>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-extrabold text-[#0f172a]">En Çok Harcama Yapanlar</h2>
            <button
              type="button"
              className="text-[12px] font-bold text-[#2f6bff]"
              onClick={() => {
                setTab("all");
                setSpendFocus(true);
                setPage(1);
              }}
            >
              Tümünü Gör
            </button>
          </div>
          <ul className="space-y-3">
            {topSpenders.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="w-4 text-[12px] font-extrabold text-[#94a3b8]">{index + 1}</span>
                <span className={`grid size-9 place-items-center rounded-full text-[11px] font-extrabold text-white ${AVATAR[index % AVATAR.length]}`}>
                  {item.initials}
                </span>
                <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#0f172a]">{item.name}</p>
                <span className="shrink-0 text-[12px] font-extrabold text-[#0f172a]">₺{formatPriceTry(item.spend)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <h2 className="mb-3 text-[15px] font-extrabold text-[#0f172a]">Müşteri Kaynakları</h2>
          <ul className="space-y-3">
            {sources.map((item) => (
              <li key={item.id}>
                <div className="mb-1 flex items-center justify-between text-[12px]">
                  <span className="text-[#64748b]">{item.name}</span>
                  <span className="font-bold text-[#0f172a]">%{item.percent}</span>
                </div>
                <span className="block h-2 overflow-hidden rounded-full bg-[#eef2f7]">
                  <span className="block h-full rounded-full bg-[#2f6bff]" style={{ width: `${item.percent}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {menu && menuRow ? (
        <FloatingMenu anchor={menu.el} onClose={() => setMenu(null)}>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]"
            onClick={() => {
              setMenu(null);
              void patchOne(menuRow, { isActive: menuRow.status !== "active", blocked: false });
            }}
          >
            {menuRow.status === "active" ? "Pasifleştir" : "Aktifleştir"}
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]"
            onClick={() => {
              setMenu(null);
              void patchOne(menuRow, { blocked: !menuRow.blocked });
            }}
          >
            {menuRow.blocked ? "Engeli kaldır" : "Engelle"}
          </button>
        </FloatingMenu>
      ) : null}
      {edit ? (
        <CustomerEditor
          customer={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={(password) => {
            setEdit(null);
            setNotice(password ? `Müşteri eklendi. Geçici şifre: ${password}` : "Müşteri kaydedildi.");
            router.refresh();
          }}
        />
      ) : null}
      {segmentOpen ? (
        <ConfirmDialog
          title="Segment oluştur"
          message={`${selected.size} müşteri seçili. Hangi gruba alınacağını seçin.`}
          extra={
            <select value={segmentGroup} onChange={(e) => setSegmentGroup(e.target.value as CustomerGroupId)} className="mt-4 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px]">
              <option value="retail">Perakende</option>
              <option value="wholesale">Toptan</option>
              <option value="vip">VIP</option>
            </select>
          }
          confirm="Uygula"
          onClose={() => setSegmentOpen(false)}
          onConfirm={() => bulk("group", segmentGroup)}
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
