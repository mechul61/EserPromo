"use client";

import Link from "next/link";
import { useEffect, useMemo, useOptimistic, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  Eye,
  ExternalLink,
  FolderOpen,
  Globe,
  Menu,
  MoreVertical,
  Plus,
  Reply,
  RotateCcw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { FloatingMenu } from "@/components/admin/FloatingMenu";
import { SITE_CONTACT } from "@/data/catalog-page";
import {
  SUPPORT_CATEGORY_LABEL,
  SUPPORT_PRIORITY_LABEL,
  SUPPORT_STATUS_LABEL,
  type SupportCategoryId,
  type SupportPriorityId,
  type SupportStatusId,
} from "@/lib/commerce/support-copy";

export type SupportKpi = {
  label: string;
  value: string;
  hint: string;
  color: string;
  icon: "total" | "open" | "waiting" | "resolved" | "rate";
};

export type SupportMessageRow = {
  id: string;
  author: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type SupportTicketRow = {
  id: string;
  publicNumber: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: SupportCategoryId;
  categoryLabel: string;
  priority: SupportPriorityId;
  priorityLabel: string;
  status: SupportStatusId;
  statusLabel: string;
  rating: number | null;
  createdAt: string;
  messages: SupportMessageRow[];
};

const KPI_ICONS = {
  total: Globe,
  open: FolderOpen,
  waiting: Clock3,
  resolved: CheckCircle2,
  rate: Star,
} as const;

const CAT_TONE: Record<SupportCategoryId, string> = {
  order: "bg-[#e8f0ff] text-[#2563eb]",
  returns: "bg-[#fff4e5] text-[#d97706]",
  payment: "bg-[#e9f9ef] text-[#16a34a]",
  invoice: "bg-[#e0f2fe] text-[#0284c7]",
  cargo: "bg-[#f1e9ff] text-[#7c3aed]",
  account: "bg-[#fce7f3] text-[#db2777]",
  other: "bg-[#eef2f7] text-[#475569]",
};

const PRI_TONE: Record<SupportPriorityId, string> = {
  low: "bg-[#e9f9ef] text-[#16a34a]",
  medium: "bg-[#fff4e5] text-[#d97706]",
  high: "bg-[#fde8f0] text-[#dc2626]",
};

const STATUS_TONE: Record<SupportStatusId, string> = {
  open: "bg-[#e9f9ef] text-[#16a34a]",
  waiting: "bg-[#fff4e5] text-[#d97706]",
  resolved: "bg-[#eef2f7] text-[#64748b]",
  archived: "bg-[#eef2f7] text-[#94a3b8]",
};

const PAGE_SIZES = [10, 25, 50] as const;
type TabId = "all" | SupportStatusId;

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr"))
    .join("");
}

export function SupportPageView({ tickets, kpis }: { tickets: SupportTicketRow[]; kpis: SupportKpi[] }) {
  const router = useRouter();
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [tab, setTab] = useState<TabId>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [rows] = useOptimistic(tickets);
  const [selectedId, setSelectedId] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ id: string; el: HTMLElement } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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
      open: rows.filter((row) => row.status === "open" || row.status === "waiting").length,
      waiting: rows.filter((row) => row.status === "waiting").length,
      resolved: rows.filter((row) => row.status === "resolved").length,
      archived: rows.filter((row) => row.status === "archived").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (tab === "open" && row.status !== "open" && row.status !== "waiting") return false;
      if (tab !== "all" && tab !== "open" && row.status !== tab) return false;
      if (q && !`${row.publicNumber} ${row.subject} ${row.name} ${row.email} ${row.messages.map((m) => m.body).join(" ")}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (priorityFilter !== "all" && row.priority !== priorityFilter) return false;
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (fromDate && new Date(row.createdAt) < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && new Date(row.createdAt) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [rows, tab, query, statusFilter, priorityFilter, categoryFilter, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const menuRow = menu ? rows.find((row) => row.id === menu.id) : null;
  const selected = rows.find((row) => row.id === selectedId) ?? filtered[0] ?? rows[0] ?? null;
  const lastAdmin = selected?.messages.filter((item) => item.author === "admin").at(-1) ?? null;
  const allSelected = pageRows.length > 0 && pageRows.every((row) => checked.has(row.id));

  function live(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  async function patch(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/support/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "Güncellenemedi");
      return false;
    }
    return true;
  }

  async function resolve(row: SupportTicketRow) {
    const ok = await patch(row.id, { status: "resolved" });
    if (!ok) return;
    setNotice(`${row.publicNumber} çözüldü olarak işaretlendi.`);
    router.refresh();
  }

  async function removeTicket(row: SupportTicketRow) {
    if (!window.confirm(`${row.publicNumber} numaralı destek talebi kalıcı olarak silinsin mi?`)) return;
    const res = await fetch(`/api/admin/support/${row.id}/`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string; publicNumber?: string };
    if (!res.ok) {
      setNotice(data.error || "Talep silinemedi");
      return;
    }
    if (selectedId === row.id) setSelectedId("");
    setChecked((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      return next;
    });
    setNotice(`${data.publicNumber || row.publicNumber} silindi.`);
    router.refresh();
  }

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "all", label: "Tüm Talepler", count: counts.all },
    { id: "open", label: "Açık", count: counts.open },
    { id: "waiting", label: "Yanıt Bekleyen", count: counts.waiting },
    { id: "resolved", label: "Çözülen", count: counts.resolved },
    { id: "archived", label: "Arşiv", count: counts.archived },
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
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Destek Talepleri</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Müşterilerden gelen destek taleplerini görüntüleyin, yanıtlayın ve yönetin.</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
          <Plus className="size-4" />
          Yeni Destek Talebi
        </button>
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
                  <p className="mt-2 text-[11px] font-semibold text-[#64748b]">{card.hint}</p>
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
              <div className="grid gap-3 lg:grid-cols-5">
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
                  <div className="relative">
                    <input value={draftQuery} onChange={(e) => setDraftQuery(e.target.value)} placeholder="Konu, açıklama veya müşteri ara..." className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 pr-10 text-[13px] outline-none" />
                    <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </label>
                <FilterSelect label="Durum" value={statusFilter} onChange={(value) => live(setStatusFilter, value)} options={[["all", "Tümü"], ...Object.entries(SUPPORT_STATUS_LABEL)]} />
                <FilterSelect label="Öncelik" value={priorityFilter} onChange={(value) => live(setPriorityFilter, value)} options={[["all", "Tümü"], ...Object.entries(SUPPORT_PRIORITY_LABEL)]} />
                <FilterSelect label="Kategori" value={categoryFilter} onChange={(value) => live(setCategoryFilter, value)} options={[["all", "Tümü"], ...Object.entries(SUPPORT_CATEGORY_LABEL)]} />
                <label className="block min-w-0">
                  <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Tarih Aralığı</span>
                  <div className="flex items-center gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <input type="date" value={fromDate} onChange={(e) => live(setFromDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 pr-8 text-[12px] text-[#64748b] outline-none" />
                      <Calendar className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    </div>
                    <span className="text-[#94a3b8]">-</span>
                    <div className="relative min-w-0 flex-1">
                      <input type="date" value={toDate} onChange={(e) => live(setToDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 pr-8 text-[12px] text-[#64748b] outline-none" />
                      <Calendar className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    </div>
                  </div>
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button type="button" onClick={() => setShowFilters(false)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] px-3.5 text-[13px] font-medium text-[#475569]">
                  Filtreleri Gizle
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftQuery("");
                    setQuery("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setCategoryFilter("all");
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
            <button type="button" onClick={() => setShowFilters(true)} className="inline-flex h-10 items-center rounded-lg border border-[#dbe3ee] px-3.5 text-[13px] font-medium text-[#475569]">Filtreleri Göster</button>
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
              <table className="min-w-[960px] w-full text-left text-[13px]">
                <thead className="border-b border-[#eef2f7] bg-[#fafbfc] text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => {
                          setChecked((prev) => {
                            const next = new Set(prev);
                            if (allSelected) pageRows.forEach((row) => next.delete(row.id));
                            else pageRows.forEach((row) => next.add(row.id));
                            return next;
                          });
                        }}
                      />
                    </th>
                    <th className="px-3 py-3">Talep No</th>
                    <th className="px-3 py-3">Konu</th>
                    <th className="px-3 py-3">Müşteri</th>
                    <th className="px-3 py-3">Kategori</th>
                    <th className="px-3 py-3">Öncelik</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3">Oluşturulma Tarihi</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#94a3b8]">Talep bulunamadı.</td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
                      <tr
                        key={row.id}
                        className={`cursor-pointer border-b border-[#f1f5f9] last:border-0 ${selectedId === row.id ? "bg-[#f8fbff]" : ""}`}
                        onClick={() => setSelectedId(row.id)}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={checked.has(row.id)}
                            onChange={() => {
                              setChecked((prev) => {
                                const next = new Set(prev);
                                if (next.has(row.id)) next.delete(row.id);
                                else next.add(row.id);
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className="px-3 py-4 font-bold text-[#2563eb]">#{row.publicNumber}</td>
                        <td className="px-3 py-4">
                          <p className="font-bold text-[#0f172a]">{row.subject}</p>
                          <p className="max-w-[240px] truncate text-[12px] text-[#94a3b8]">{row.messages[0]?.body || "—"}</p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-semibold text-[#0f172a]">{row.name}</p>
                          <p className="text-[12px] text-[#94a3b8]">{row.email}</p>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${CAT_TONE[row.category]}`}>{row.categoryLabel}</span>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${PRI_TONE[row.priority]}`}>{row.priorityLabel}</span>
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_TONE[row.status]}`}>{row.statusLabel}</span>
                        </td>
                        <td className="px-3 py-4 text-[12px] text-[#64748b]">{fmtWhen(row.createdAt)}</td>
                        <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setSelectedId(row.id)}>
                              <Eye className="size-4" />
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
                  <button key={n} type="button" onClick={() => setPage(n)} className={`inline-flex size-8 items-center justify-center rounded-lg text-[12px] font-bold ${currentPage === n ? "bg-[#2f6bff] text-white" : "border border-[#e8edf3] text-[#475569]"}`}>{n}</button>
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

        <aside className="xl:sticky xl:top-4">
          {selected ? (
            <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-extrabold text-[#2563eb]">#{selected.publicNumber}</p>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_TONE[selected.status]}`}>{selected.statusLabel}</span>
              </div>
              <h2 className="mt-3 text-[16px] font-extrabold text-[#0f172a]">{selected.subject}</h2>
              <p className="mt-1 text-[12px] text-[#94a3b8]">{fmtWhen(selected.createdAt)} · {selected.categoryLabel}</p>

              {selected.rating ? (
                <p className="mt-3 text-[12px] font-semibold text-[#0f172a]">Memnuniyet: {selected.rating}/5</p>
              ) : null}

              <div className="mt-4 rounded-xl bg-[#f8fafc] p-3">
                <p className="text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">Müşteri Bilgileri</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#e8eef7] text-[12px] font-extrabold text-navy">{initials(selected.name)}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0f172a]">{selected.name}</p>
                    <p className="truncate text-[12px] text-[#64748b]">{selected.email}</p>
                    {selected.phone ? <p className="text-[12px] text-[#64748b]">{selected.phone}</p> : null}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">Talep Detayları</p>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[#334155]">{selected.messages[0]?.body}</p>
              </div>

              {lastAdmin ? (
                <div className="mt-4 rounded-xl border border-[#e8edf3] p-3">
                  <p className="text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">Son Yanıt</p>
                  <div className="mt-2 flex items-start gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-[#e8eef7] text-[11px] font-extrabold">Y</span>
                    <div>
                      <p className="text-[12px] font-bold">{lastAdmin.authorName} · {fmtWhen(lastAdmin.createdAt)}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#334155]">{lastAdmin.body}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <button type="button" onClick={() => setHistoryOpen(true)} className="mt-4 h-10 w-full rounded-lg border border-[#e8edf3] text-[13px] font-semibold text-[#475569]">
                Tüm Yanıtları Görüntüle ({selected.messages.length})
              </button>
              <div className="mt-3 grid gap-2">
                <button type="button" disabled={selected.status === "resolved" || selected.status === "archived"} onClick={() => setReplyOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#2f6bff] text-[13px] font-semibold text-[#2f6bff] disabled:opacity-50">
                  <Reply className="size-4" />
                  Yanıtla
                </button>
                <button type="button" disabled={selected.status === "resolved"} onClick={() => void resolve(selected)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2f6bff] text-[13px] font-semibold text-white disabled:opacity-50">
                  <CheckCircle2 className="size-4" />
                  Talebi Çözüldü Olarak İşaretle
                </button>
                <button
                  type="button"
                  onClick={() => void removeTicket(selected)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#fecaca] text-[13px] font-semibold text-[#dc2626] hover:bg-[#fef2f2]"
                >
                  <Trash2 className="size-4" />
                  Talebi Sil
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-[18px] bg-white p-5 text-[13px] text-[#94a3b8] shadow-[0_8px_24px_rgba(15,23,42,0.04)]">Talep seçin.</section>
          )}
        </aside>
      </div>

      {menu && menuRow ? (
        <FloatingMenu anchor={menu.el} onClose={() => setMenu(null)}>
          <button type="button" className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]" onClick={() => { setMenu(null); void resolve(menuRow); }}>
            Çözüldü işaretle
          </button>
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]"
            onClick={() => {
              setMenu(null);
              void patch(menuRow.id, { status: "archived" }).then((ok) => { if (ok) router.refresh(); });
            }}
          >
            Arşivle
          </button>
          {menuRow.status === "resolved" || menuRow.status === "archived" ? (
            <button
              type="button"
              className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]"
              onClick={() => {
                setMenu(null);
                void patch(menuRow.id, { status: "waiting" }).then((ok) => { if (ok) router.refresh(); });
              }}
            >
              Yeniden aç
            </button>
          ) : null}
          <button
            type="button"
            className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]"
            onClick={() => {
              setMenu(null);
              void patch(menuRow.id, { priority: "high" }).then((ok) => { if (ok) router.refresh(); });
            }}
          >
            Yüksek öncelik
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#dc2626] hover:bg-[#fef2f2]"
            onClick={() => {
              setMenu(null);
              void removeTicket(menuRow);
            }}
          >
            <Trash2 className="size-3.5" />
            Sil
          </button>
        </FloatingMenu>
      ) : null}

      {historyOpen && selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between">
              <h2 className="text-[16px] font-extrabold">Yanıt geçmişi</h2>
              <button type="button" onClick={() => setHistoryOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
            </div>
            <ul className="mt-4 space-y-3">
              {selected.messages.map((item) => (
                <li key={item.id} className="rounded-xl border border-[#eef2f7] p-3">
                  <p className="text-[12px] font-bold">{item.authorName} · {fmtWhen(item.createdAt)}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] text-[#334155]">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {replyOpen && selected ? (
        <ReplyModal
          onClose={() => setReplyOpen(false)}
          onSave={async (body) => {
            const ok = await patch(selected.id, { body });
            if (!ok) return;
            setReplyOpen(false);
            setNotice("Yanıt gönderildi.");
            router.refresh();
          }}
        />
      ) : null}
      {createOpen ? (
        <CreateTicketModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none">
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );
}

function ReplyModal({ onClose, onSave }: { onClose: () => void; onSave: (body: string) => Promise<void> }) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-extrabold">Yanıt yaz</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-4 w-full rounded-lg border border-[#dbe3ee] px-3 py-2 text-[13px] outline-none" />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">Vazgeç</button>
          <button
            type="button"
            disabled={pending || body.trim().length < 2}
            onClick={() => {
              setPending(true);
              void onSave(body).finally(() => setPending(false));
            }}
            className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Gönderiliyor…" : "Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateTicketModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    body: "",
    category: "other" as SupportCategoryId,
    priority: "medium" as SupportPriorityId,
  });

  async function save() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/support/", {
      method: "POST",
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-extrabold">Yeni destek talebi</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
        </div>
        <div className="mt-4 grid gap-3">
          <Field label="Müşteri adı" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="E-posta" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          <Field label="Telefon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
          <Field label="Konu" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} />
          <label className="block text-[12px] font-bold">
            Mesaj
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} className="mt-1 w-full rounded-lg border border-[#dbe3ee] px-3 py-2 text-[13px] outline-none" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-bold">
              Kategori
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SupportCategoryId })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px]">
                {Object.entries(SUPPORT_CATEGORY_LABEL).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
            <label className="block text-[12px] font-bold">
              Öncelik
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as SupportPriorityId })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px]">
                {Object.entries(SUPPORT_PRIORITY_LABEL).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
          </div>
        </div>
        {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">Vazgeç</button>
          <button type="button" disabled={pending} onClick={() => void save()} className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60">{pending ? "Kaydediliyor…" : "Oluştur"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-[12px] font-bold">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
    </label>
  );
}
