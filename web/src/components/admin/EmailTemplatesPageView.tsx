"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Braces,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  ExternalLink,
  ListOrdered,
  Lock,
  Mail,
  MailCheck,
  Menu,
  MoreVertical,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import {
  EMAIL_CATEGORY_LABEL,
  EMAIL_LANGUAGE_LABEL,
  EMAIL_VARIABLES,
  SAMPLE_EMAIL_VARS,
  renderEmailHtml,
  type EmailCategoryId,
  type EmailLanguageId,
} from "@/lib/commerce/email-copy";

export type EmailKpi = {
  label: string;
  value: string;
  delta?: number;
  color: string;
  icon: "total" | "active" | "passive" | "sent" | "success";
};

export type EmailTemplateRow = {
  id: string;
  key: string;
  name: string;
  description: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  category: EmailCategoryId;
  categoryLabel: string;
  language: EmailLanguageId;
  languageLabel: string;
  icon: string;
  showOrderBox: boolean;
  isActive: boolean;
  isSystem: boolean;
  updatedAt: string;
};

const KPI_ICONS = {
  total: Mail,
  active: CheckCircle2,
  passive: Clock3,
  sent: Send,
  success: MailCheck,
} as const;

const ICON_MAP = {
  cart: ShoppingCart,
  truck: Truck,
  package: Package,
  user: UserRound,
  lock: Lock,
  tag: Tag,
  bag: ShoppingBag,
  mail: Mail,
} as const;

const ICON_TONE: Record<string, string> = {
  cart: "bg-[#e9f9ef] text-[#16a34a]",
  truck: "bg-[#e8f0ff] text-[#2563eb]",
  package: "bg-[#fff4e5] text-[#d97706]",
  user: "bg-[#f1e9ff] text-[#7c3aed]",
  lock: "bg-[#eef2f7] text-[#475569]",
  tag: "bg-[#fde8f0] text-[#db2777]",
  bag: "bg-[#fce7f3] text-[#db2777]",
  mail: "bg-[#e8f0ff] text-[#2563eb]",
};

const CAT_TONE: Record<EmailCategoryId, string> = {
  order: "bg-[#e8f0ff] text-[#2563eb]",
  customer: "bg-[#f1e9ff] text-[#7c3aed]",
  marketing: "bg-[#fce7f3] text-[#db2777]",
  other: "bg-[#eef2f7] text-[#475569]",
};

const PAGE_SIZES = [10, 25, 50] as const;
type TabId = "all" | EmailCategoryId;
type SortId = "updated" | "name" | "category";

function pctFmt(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
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

function token(key: string) {
  return `{{${key}}}`;
}

export function EmailTemplatesPageView({
  templates,
  kpis,
  smtpReady,
}: {
  templates: EmailTemplateRow[];
  kpis: EmailKpi[];
  smtpReady: boolean;
}) {
  const router = useRouter();
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [tab, setTab] = useState<TabId>("all");
  const [sort, setSort] = useState<SortId>("updated");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState(templates);
  const [previewId, setPreviewId] = useState(templates[0]?.id ?? "");
  const [showPreview, setShowPreview] = useState(true);
  const varsRef = useRef<HTMLElement>(null);
  const [smtpOpen, setSmtpOpen] = useState(false);
  const [edit, setEdit] = useState<EmailTemplateRow | "new" | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setRows(templates);
    if (!templates.some((row) => row.id === previewId)) setPreviewId(templates[0]?.id ?? "");
  }, [templates, previewId]);

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
      order: rows.filter((row) => row.category === "order").length,
      customer: rows.filter((row) => row.category === "customer").length,
      marketing: rows.filter((row) => row.category === "marketing").length,
      other: rows.filter((row) => row.category === "other").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((row) => {
      if (tab !== "all" && row.category !== tab) return false;
      if (q && !`${row.name} ${row.subject} ${row.description}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "all" && (statusFilter === "active") !== row.isActive) return false;
      if (categoryFilter !== "all" && row.category !== categoryFilter) return false;
      if (languageFilter !== "all" && row.language !== languageFilter) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "tr");
      if (sort === "category") return a.categoryLabel.localeCompare(b.categoryLabel, "tr") || a.name.localeCompare(b.name, "tr");
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [rows, tab, query, statusFilter, categoryFilter, languageFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => selected.has(row.id));
  const preview = rows.find((row) => row.id === previewId) ?? filtered[0] ?? rows[0] ?? null;

  function live(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  async function patch(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/emails/templates/${id}/`, {
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

  async function toggle(row: EmailTemplateRow) {
    const next = !row.isActive;
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, isActive: next } : item)));
    const ok = await patch(row.id, { isActive: next });
    if (!ok) {
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, isActive: row.isActive } : item)));
      return;
    }
    router.refresh();
  }

  async function remove(row: EmailTemplateRow) {
    if (row.isSystem) {
      setNotice("Sistem şablonları silinemez.");
      return;
    }
    const res = await fetch(`/api/admin/emails/templates/${row.id}/`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "Silinemedi");
      return;
    }
    setNotice("Şablon silindi.");
    router.refresh();
  }

  async function copyVar(key: string) {
    try {
      await navigator.clipboard.writeText(token(key));
      setNotice(`${token(key)} kopyalandı.`);
    } catch {
      setNotice("Kopyalanamadı");
    }
  }

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "all", label: "Tüm Şablonlar", count: counts.all },
    { id: "order", label: "Sipariş", count: counts.order },
    { id: "customer", label: "Müşteri", count: counts.customer },
    { id: "marketing", label: "Pazarlama", count: counts.marketing },
    { id: "other", label: "Diğer", count: counts.other },
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
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">E-Posta Şablonları</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Mağazanızda kullanılan e-posta şablonlarını yönetin, düzenleyin ve yeni şablonlar oluşturun.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => varsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-4 text-[13px] font-semibold text-[#475569]">
            <Braces className="size-4" />
            Değişkenler
          </button>
          <button type="button" onClick={() => setEdit("new")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
            <Plus className="size-4" />
            Yeni Şablon Oluştur
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
                  <p className="text-[13px] font-semibold text-[#94a3b8]">{card.label}</p>
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

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
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
                  {item.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 border-b border-[#eef2f7] p-4 lg:grid-cols-5">
              <label className="block min-w-0 lg:col-span-2">
                <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
                <div className="relative">
                  <input
                    value={draftQuery}
                    onChange={(e) => setDraftQuery(e.target.value)}
                    placeholder="Şablon adı, konu veya açıklama ara..."
                    className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 pr-10 text-[13px] outline-none"
                  />
                  <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                </div>
              </label>
              <FilterSelect label="Durum" value={statusFilter} onChange={(value) => live(setStatusFilter, value)} options={[["all", "Tümü"], ["active", "Aktif"], ["passive", "Pasif"]]} />
              <FilterSelect label="Kategori" value={categoryFilter} onChange={(value) => live(setCategoryFilter, value)} options={[["all", "Tümü"], ...Object.entries(EMAIL_CATEGORY_LABEL)]} />
              <FilterSelect label="Dil" value={languageFilter} onChange={(value) => live(setLanguageFilter, value)} options={[["all", "Tümü"], ...Object.entries(EMAIL_LANGUAGE_LABEL)]} />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
              <button
                type="button"
                onClick={() => setSort((current) => (current === "updated" ? "name" : current === "name" ? "category" : "updated"))}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] px-3.5 text-[13px] font-medium text-[#475569]"
              >
                <ListOrdered className="size-4" />
                Sıralama: {sort === "updated" ? "Tarih" : sort === "name" ? "Ad" : "Kategori"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftQuery("");
                  setQuery("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setLanguageFilter("all");
                  setPage(1);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#dbe3ee] px-3.5 text-[13px] font-medium text-[#475569]"
              >
                <RotateCcw className="size-4" />
                Temizle
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-left text-[13px]">
                <thead className="border-y border-[#eef2f7] text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">
                  <tr>
                    <th className="px-4 py-3">
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
                    <th className="px-3 py-3">Şablon Adı</th>
                    <th className="px-3 py-3">Konu</th>
                    <th className="px-3 py-3">Kategori</th>
                    <th className="px-3 py-3">Dil</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3">Son Güncelleme</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-[#94a3b8]">Şablon bulunamadı.</td>
                    </tr>
                  ) : (
                    pageRows.map((row) => {
                      const Icon = ICON_MAP[row.icon as keyof typeof ICON_MAP] ?? Mail;
                      return (
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
                            <div className="flex items-start gap-3">
                              <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${ICON_TONE[row.icon] || ICON_TONE.mail}`}>
                                <Icon className="size-4" />
                              </span>
                              <div>
                                <p className="font-bold text-[#0f172a]">{row.name}</p>
                                <p className="max-w-[220px] truncate text-[12px] text-[#94a3b8]">{row.description || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[240px] truncate px-3 py-4 font-medium text-[#334155]">{row.subject}</td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${CAT_TONE[row.category]}`}>{row.categoryLabel}</span>
                          </td>
                          <td className="px-3 py-4 text-[#64748b]">{row.languageLabel}</td>
                          <td className="px-3 py-4">
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold">
                              <span className={`size-2 rounded-full ${row.isActive ? "bg-[#22c55e]" : "bg-[#cbd5e1]"}`} />
                              <span className={row.isActive ? "text-[#16a34a]" : "text-[#94a3b8]"}>{row.isActive ? "Aktif" : "Pasif"}</span>
                            </span>
                          </td>
                          <td className="px-3 py-4 text-[12px] text-[#64748b]">{fmtWhen(row.updatedAt)}</td>
                          <td className="relative px-3 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => { setPreviewId(row.id); setShowPreview(true); }}>
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
                              <div className="absolute right-3 top-12 z-20 w-44 overflow-hidden rounded-xl border border-[#e8edf3] bg-white py-1 shadow-lg">
                                <button type="button" className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]" onClick={() => { setMenuId(null); void toggle(row); }}>
                                  {row.isActive ? "Pasifleştir" : "Aktifleştir"}
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
                  className="ml-2 h-8 rounded-lg border border-[#e8edf3] px-2 text-[12px]"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>{n} / sayfa</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-[13px] font-extrabold text-[#0f172a]">Şablon Önizleme</h2>
            <select
              value={preview?.id ?? ""}
              onChange={(e) => setPreviewId(e.target.value)}
              className="mt-3 h-10 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none"
            >
              {rows.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowPreview(true)} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#e8edf3] text-[13px] font-semibold text-[#475569]">
              <Eye className="size-4" />
              Önizlemeyi Göster
            </button>
            {showPreview && preview ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-[#e8edf3] bg-[#f8fafc]">
                <iframe title="Önizleme" className="h-[420px] w-full bg-white" srcDoc={renderEmailHtml({
                  heading: preview.heading,
                  body: preview.body,
                  ctaLabel: preview.ctaLabel,
                  ctaUrl: preview.ctaUrl,
                  showOrderBox: preview.showOrderBox,
                  vars: SAMPLE_EMAIL_VARS,
                })} />
              </div>
            ) : null}
          </section>
          <section ref={varsRef} className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Kullanılabilir Değişkenler</h2>
            <p className="mt-1 text-[11px] text-[#94a3b8]">Şablona yapıştırmak için satıra tıklayın; tümü burada.</p>
            <VariableList onPick={(key) => void copyVar(key)} />
          </section>
          <section className="rounded-[18px] bg-[#eef4ff] p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13px] font-extrabold text-[#1e3a8a]">SMTP</h2>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${smtpReady ? "bg-[#e9f9ef] text-[#16a34a]" : "bg-[#fff4e5] text-[#d97706]"}`}>
                {smtpReady ? "Hazır" : "Eksik"}
              </span>
            </div>
            <p className="mt-2 text-[12px] text-[#334155]">Şablonlar sipariş, kargo, üyelik, şifre ve favori indiriminde kullanılır. Gönderim için SMTP gerekir.</p>
            <button type="button" onClick={() => setSmtpOpen(true)} className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#2f6bff]">
              SMTP ayarları
              <ArrowRight className="size-3.5" />
            </button>
          </section>
        </aside>
      </div>

      {edit ? (
        <TemplateEditor
          template={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            router.refresh();
          }}
        />
      ) : null}
      {smtpOpen ? <SmtpEditor onClose={() => setSmtpOpen(false)} onSaved={() => { setSmtpOpen(false); router.refresh(); }} /> : null}
    </div>
  );
}

function VariableList({ onPick, compact = false }: { onPick: (key: string) => void; compact?: boolean }) {
  const [q, setQ] = useState("");
  const items = EMAIL_VARIABLES.filter((item) => {
    const hay = `${item.key} ${item.label}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  return (
    <div className="mt-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#94a3b8]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Değişken ara..."
          className="h-9 w-full rounded-lg border border-[#e8edf3] bg-white pl-9 pr-3 text-[12px] outline-none"
        />
      </div>
      <ul className={`mt-2 space-y-1 overflow-auto pr-1 ${compact ? "max-h-[58vh]" : "max-h-[380px]"}`}>
        {items.length === 0 ? (
          <li className="px-1 py-3 text-[12px] text-[#94a3b8]">Eşleşen değişken yok.</li>
        ) : (
          items.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onPick(item.key)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-[#f8fafc]"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[12px] font-bold text-[#2563eb]">{token(item.key)}</span>
                  <span className="block text-[11px] text-[#94a3b8]">{item.label}</span>
                </span>
                <Copy className="size-3.5 shrink-0 text-[#94a3b8]" />
              </button>
            </li>
          ))
        )}
      </ul>
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none">
        {options.map(([id, name]) => (
          <option key={id} value={id}>{name}</option>
        ))}
      </select>
    </label>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: EmailTemplateRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: template?.name ?? "",
    description: template?.description ?? "",
    subject: template?.subject ?? "",
    heading: template?.heading ?? "",
    body: template?.body ?? "",
    ctaLabel: template?.ctaLabel ?? "",
    ctaUrl: template?.ctaUrl ?? "",
    category: template?.category ?? "other",
    language: template?.language ?? "tr",
    isActive: template?.isActive ?? true,
    showOrderBox: template?.showOrderBox ?? false,
  });

  async function save() {
    setPending(true);
    setError(null);
    const url = template ? `/api/admin/emails/templates/${template.id}/` : "/api/admin/emails/templates/";
    const res = await fetch(url, {
      method: template ? "PATCH" : "POST",
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
      <div className="grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 overflow-auto p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-[16px] font-extrabold">{template ? "Şablonu düzenle" : "Yeni şablon"}</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
        </div>
        <div className="mt-4 grid gap-3">
          <Field label="Ad" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <Field label="Açıklama" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
          <Field label="Konu" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} />
          <Field label="Başlık" value={form.heading} onChange={(value) => setForm({ ...form, heading: value })} />
          <label className="block text-[12px] font-bold">
            Gövde
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={6} className="mt-1 w-full rounded-lg border border-[#dbe3ee] px-3 py-2 text-[13px] outline-none" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Buton yazısı" value={form.ctaLabel} onChange={(value) => setForm({ ...form, ctaLabel: value })} />
            <Field label="Buton bağlantısı" value={form.ctaUrl} onChange={(value) => setForm({ ...form, ctaUrl: value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-bold">
              Kategori
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EmailCategoryId })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px]">
                {Object.entries(EMAIL_CATEGORY_LABEL).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
            <label className="block text-[12px] font-bold">
              Dil
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as EmailLanguageId })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px]">
                {Object.entries(EMAIL_LANGUAGE_LABEL).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Aktif (otomatik gönder)
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" checked={form.showOrderBox} onChange={(e) => setForm({ ...form, showOrderBox: e.target.checked })} />
            Sipariş özeti kutusu
          </label>
        </div>
        {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">Vazgeç</button>
          <button type="button" disabled={pending} onClick={() => void save()} className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60">{pending ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
        </div>
        <aside className="overflow-auto border-t border-[#eef2f7] bg-[#f8fafc] p-4 lg:border-l lg:border-t-0">
          <h3 className="text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Kullanılabilir Değişkenler</h3>
          <p className="mt-1 text-[11px] text-[#94a3b8]">Tıklayınca gövdeye eklenir.</p>
          <VariableList
            compact
            onPick={(key) => {
              const piece = token(key);
              setForm((current) => ({ ...current, body: current.body ? `${current.body} ${piece}` : piece }));
            }}
          />
        </aside>
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

function SmtpEditor({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ host: "", port: 587, user: "", pass: "", from: SITE_CONTACT.email as string });

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/emails/smtp/");
      const data = (await res.json()) as { host?: string; port?: number; user?: string; pass?: string; from?: string };
      setForm({
        host: data.host || "",
        port: data.port || 587,
        user: data.user || "",
        pass: data.pass || "",
        from: data.from || SITE_CONTACT.email,
      });
    })();
  }, []);

  async function save() {
    setPending(true);
    setError(null);
    const res = await fetch("/api/admin/emails/smtp/", {
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
          <h2 className="text-[16px] font-extrabold">SMTP ayarları</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
        </div>
        <p className="mt-1 text-[12px] text-[#94a3b8]">Boş bırakılan veya maskeli şifre mevcut değeri korur.</p>
        <div className="mt-4 grid gap-3">
          <Field label="Host" value={form.host} onChange={(value) => setForm({ ...form, host: value })} />
          <label className="block text-[12px] font-bold">
            Port
            <input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) || 587 })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
          </label>
          <Field label="Kullanıcı" value={form.user} onChange={(value) => setForm({ ...form, user: value })} />
          <Field label="Şifre" value={form.pass} onChange={(value) => setForm({ ...form, pass: value })} />
          <Field label="Gönderen" value={form.from} onChange={(value) => setForm({ ...form, from: value })} />
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
