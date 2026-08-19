"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  ExternalLink,
  KeyRound,
  Menu,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import {
  STAFF_ROLE_COLOR,
  STAFF_ROLE_HINT,
  STAFF_ROLE_LABEL,
  STAFF_ROLE_TONE,
  type StaffRoleId,
} from "@/lib/admin/staff-copy";

export type StaffKpi = {
  label: string;
  value: string;
  color: string;
  icon: "total" | "active" | "passive" | "admin" | "recent";
};

export type StaffUserRow = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: StaffRoleId;
  roleLabel: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type StaffActivity = { id: string; text: string; at: string };
export type StaffSessionRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

const KPI_ICONS = {
  total: Users,
  active: UserPlus,
  passive: UserMinus,
  admin: ShieldCheck,
  recent: Clock3,
} as const;

const AVATAR = ["bg-[#7c3aed]", "bg-[#2f6bff]", "bg-[#f59e0b]", "bg-[#14b8a6]", "bg-[#22c55e]", "bg-[#ec4899]"];
const PAGE_SIZES = [10, 25, 50] as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr"))
    .join("");
}

function splitWhen(iso: string | null) {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("tr-TR"),
    time: d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
  };
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

export function StaffUsersPageView({
  currentUserId,
  currentRole,
  canManage,
  users,
  kpis,
  activities,
  sessions,
}: {
  currentUserId: string;
  currentRole: string;
  canManage: boolean;
  users: StaffUserRow[];
  kpis: StaffKpi[];
  activities: StaffActivity[];
  sessions: StaffSessionRow[];
}) {
  const router = useRouter();
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifyFilter, setVerifyFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [menuId, setMenuId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<StaffUserRow | null>(null);
  const [viewUser, setViewUser] = useState<StaffUserRow | null>(null);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [permsOpen, setPermsOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

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
    return users.filter((row) => {
      if (q && !`${row.name} ${row.email} ${row.username}`.toLowerCase().includes(q)) return false;
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      if (statusFilter === "active" && !row.isActive) return false;
      if (statusFilter === "passive" && row.isActive) return false;
      if (verifyFilter === "yes" && !row.emailVerified) return false;
      if (verifyFilter === "no" && row.emailVerified) return false;
      if (fromDate && new Date(row.createdAt) < new Date(`${fromDate}T00:00:00`)) return false;
      if (toDate && new Date(row.createdAt) > new Date(`${toDate}T23:59:59`)) return false;
      return true;
    });
  }, [users, query, roleFilter, statusFilter, verifyFilter, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  const allSelected = pageRows.length > 0 && pageRows.every((row) => checked.has(row.id));

  const roleSlices = (Object.keys(STAFF_ROLE_LABEL) as StaffRoleId[])
    .map((id) => ({
      id,
      label: STAFF_ROLE_LABEL[id],
      count: users.filter((row) => row.role === id).length,
      color: STAFF_ROLE_COLOR[id],
    }))
    .filter((item) => item.count > 0);
  const roleTotal = users.length || 1;

  function live(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  async function patch(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/staff/${id}/`, {
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

  async function remove(id: string) {
    const res = await fetch(`/api/admin/staff/${id}/`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setNotice(data.error || "Silinemedi");
      return;
    }
    setNotice("Kullanıcı kaldırıldı.");
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
              <Eye className="size-4" />
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
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Kullanıcılar</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Sisteme erişim sağlayan kullanıcıları yönetin, rollerini ve yetkilerini düzenleyin.</p>
        </div>
        {canManage ? (
          <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
            <Plus className="size-4" />
            Yeni Kullanıcı Ekle
          </button>
        ) : null}
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
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="grid gap-3 lg:grid-cols-5">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Arama</span>
                <div className="relative">
                  <input value={draftQuery} onChange={(e) => setDraftQuery(e.target.value)} placeholder="Ad, e-posta veya kullanıcı adı" className="h-11 w-full rounded-lg border border-[#dbe3ee] px-3 pr-10 text-[13px] outline-none" />
                  <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                </div>
              </label>
              <FilterSelect label="Rol" value={roleFilter} onChange={(value) => live(setRoleFilter, value)} options={[["all", "Tümü"], ...Object.entries(STAFF_ROLE_LABEL)]} />
              <FilterSelect label="Durum" value={statusFilter} onChange={(value) => live(setStatusFilter, value)} options={[["all", "Tümü"], ["active", "Aktif"], ["passive", "Pasif"]]} />
              <FilterSelect label="Email Doğrulama" value={verifyFilter} onChange={(value) => live(setVerifyFilter, value)} options={[["all", "Tümü"], ["yes", "Doğrulanmış"], ["no", "Doğrulanmamış"]]} />
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[13px] font-bold text-[#1e293b]">Kayıt Tarihi</span>
                <div className="flex items-center gap-1.5">
                  <div className="relative min-w-0 flex-1">
                    <input type="date" value={fromDate} onChange={(e) => live(setFromDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 pr-8 text-[12px] text-[#64748b] outline-none" />
                    <Calendar className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                  <span className="text-[#94a3b8]">-</span>
                  <div className="relative min-w-0 flex-1">
                    <input type="date" value={toDate} onChange={(e) => live(setToDate, e.target.value)} className="h-11 w-full rounded-lg border border-[#dbe3ee] px-2 pr-8 text-[12px] text-[#64748b] outline-none" />
                    <Calendar className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                  </div>
                </div>
              </label>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setDraftQuery("");
                  setQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                  setVerifyFilter("all");
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

          <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="border-b border-[#e8edf3] px-5 py-4">
              <p className="text-[15px] font-extrabold text-[#2f6bff]">Kullanıcı Listesi ({filtered.length})</p>
            </div>
            <div className="overflow-x-auto">
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
                    <th className="px-3 py-3">Kullanıcı</th>
                    <th className="px-3 py-3">Rol</th>
                    <th className="px-3 py-3">E-posta</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3">Kayıt Tarihi</th>
                    <th className="px-3 py-3">Son Giriş</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-[#94a3b8]">Personel bulunamadı.</td>
                    </tr>
                  ) : (
                    pageRows.map((row, i) => {
                      const created = splitWhen(row.createdAt);
                      const last = splitWhen(row.lastLoginAt);
                      return (
                        <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0">
                          <td className="px-4 py-4">
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
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`grid size-10 place-items-center rounded-full text-[12px] font-extrabold text-white ${AVATAR[i % AVATAR.length]}`}>
                                {initials(row.name)}
                              </span>
                              <div>
                                <p className="font-bold text-[#0f172a]">
                                  {row.name}
                                  {row.id === currentUserId ? (
                                    <span className="ml-2 rounded-full bg-[#e8f0ff] px-2 py-0.5 text-[10px] font-extrabold text-[#2563eb]">Siz</span>
                                  ) : null}
                                </p>
                                <p className="text-[12px] text-[#94a3b8]">/{row.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${STAFF_ROLE_TONE[row.role]}`}>{row.roleLabel}</span>
                          </td>
                          <td className="px-3 py-4 text-[#334155]">{row.email}</td>
                          <td className="px-3 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${row.isActive ? "bg-[#e9f9ef] text-[#16a34a]" : "bg-[#fde8f0] text-[#dc2626]"}`}>
                              {row.isActive ? "Aktif" : "Pasif"}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <p className="font-semibold text-[#0f172a]">{created.date}</p>
                            <p className="text-[12px] text-[#94a3b8]">{created.time}</p>
                          </td>
                          <td className="px-3 py-4">
                            <p className="font-semibold text-[#0f172a]">{last.date}</p>
                            <p className="text-[12px] text-[#94a3b8]">{last.time || "—"}</p>
                          </td>
                          <td className="relative px-3 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setViewUser(row)}>
                                <Eye className="size-4" />
                              </button>
                              {canManage ? (
                                <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setEditUser(row)}>
                                  <Pencil className="size-4" />
                                </button>
                              ) : null}
                              <button type="button" className="grid size-8 place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f8fafc]" onClick={() => setMenuId(menuId === row.id ? null : row.id)}>
                                <MoreVertical className="size-4" />
                              </button>
                            </div>
                            {menuId === row.id ? (
                              <div className="absolute right-3 top-12 z-20 w-48 overflow-hidden rounded-xl border border-[#e8edf3] bg-white py-1 shadow-lg">
                                {canManage ? (
                                  <>
                                    <button type="button" className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]" onClick={() => { setMenuId(null); void patch(row.id, { isActive: !row.isActive }).then((ok) => { if (ok) router.refresh(); }); }}>
                                      {row.isActive ? "Pasifleştir" : "Aktifleştir"}
                                    </button>
                                    <button type="button" className="flex w-full px-3 py-2 text-left text-[12px] hover:bg-[#f8fafc]" onClick={() => { setMenuId(null); void patch(row.id, { revokeSessions: true }).then((ok) => { if (ok) { setNotice("Oturumlar kapatıldı."); router.refresh(); } }); }}>
                                      Oturumları kapat
                                    </button>
                                    {row.id !== currentUserId ? (
                                      <button type="button" className="flex w-full px-3 py-2 text-left text-[12px] text-[#dc2626] hover:bg-[#f8fafc]" onClick={() => { setMenuId(null); void remove(row.id); }}>
                                        Sil
                                      </button>
                                    ) : null}
                                  </>
                                ) : (
                                  <p className="px-3 py-2 text-[12px] text-[#94a3b8]">Yetkiniz yok</p>
                                )}
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

        <aside className="space-y-4 xl:sticky xl:top-4">
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-[14px] font-extrabold text-[#0f172a]">Rol Dağılımı</h2>
            <div className="mt-4 flex items-center gap-4">
              <RoleDonut slices={roleSlices} total={users.length} />
              <ul className="min-w-0 flex-1 space-y-2">
                {roleSlices.map((item) => (
                  <li key={item.id} className="text-[11px] leading-tight">
                    <span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: item.color }} />
                    <span className="font-semibold text-[#334155]">{item.label}</span>
                    <span className="block pl-3.5 text-[#94a3b8]">{item.count} (%{(item.count / roleTotal * 100).toLocaleString("tr-TR", { maximumFractionDigits: 1 })})</span>
                  </li>
                ))}
                {roleSlices.length === 0 ? <li className="text-[12px] text-[#94a3b8]">Personel yok.</li> : null}
              </ul>
            </div>
          </section>

          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-[14px] font-extrabold text-[#0f172a]">Hızlı İşlemler</h2>
            <div className="mt-3 space-y-1">
              <QuickBtn icon={UserPlus} label="Yeni Kullanıcı Ekle" onClick={() => canManage && setCreateOpen(true)} />
              <QuickBtn icon={Shield} label="Rol Yönetimi" onClick={() => setRolesOpen(true)} />
              <QuickBtn icon={KeyRound} label="İzin Grupları" onClick={() => setPermsOpen(true)} />
              <QuickBtn icon={ExternalLink} label="Oturumları Yönet" onClick={() => setSessionsOpen(true)} />
            </div>
          </section>

          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-[14px] font-extrabold text-[#0f172a]">Son Aktiviteler</h2>
            <ul className="mt-3 space-y-3">
              {activities.length === 0 ? (
                <li className="text-[12px] text-[#94a3b8]">Henüz aktivite yok.</li>
              ) : (
                activities.map((item) => (
                  <li key={item.id} className="relative pl-4">
                    <span className="absolute left-0 top-1.5 size-2 rounded-full bg-[#2f6bff]" />
                    <p className="text-[12px] font-semibold text-[#0f172a]">{item.text}</p>
                    <p className="text-[11px] text-[#94a3b8]">{fmtWhen(item.at)}</p>
                  </li>
                ))
              )}
            </ul>
            <button type="button" onClick={() => setActivityOpen(true)} className="mt-3 text-[12px] font-bold text-[#2f6bff]">
              Tüm aktiviteleri görüntüle →
            </button>
          </section>
        </aside>
      </div>

      {viewUser ? (
        <Modal title={viewUser.name} onClose={() => setViewUser(null)}>
          <dl className="space-y-2 text-[13px]">
            <Row k="Kullanıcı adı" v={`/${viewUser.username}`} />
            <Row k="E-posta" v={viewUser.email} />
            <Row k="Rol" v={viewUser.roleLabel} />
            <Row k="Durum" v={viewUser.isActive ? "Aktif" : "Pasif"} />
            <Row k="E-posta doğrulama" v={viewUser.emailVerified ? "Doğrulandı" : "Doğrulanmadı"} />
            <Row k="Kayıt" v={fmtWhen(viewUser.createdAt)} />
            <Row k="Son giriş" v={viewUser.lastLoginAt ? fmtWhen(viewUser.lastLoginAt) : "—"} />
          </dl>
        </Modal>
      ) : null}

      {rolesOpen ? (
        <Modal title="Rol Yönetimi" onClose={() => setRolesOpen(false)}>
          <ul className="space-y-3">
            {(Object.keys(STAFF_ROLE_LABEL) as StaffRoleId[]).map((id) => (
              <li key={id} className="rounded-xl border border-[#eef2f7] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${STAFF_ROLE_TONE[id]}`}>{STAFF_ROLE_LABEL[id]}</span>
                  <span className="text-[12px] font-bold text-[#64748b]">{users.filter((row) => row.role === id).length} kişi</span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[#64748b]">{STAFF_ROLE_HINT[id]}</p>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}

      {permsOpen ? (
        <Modal title="İzin Grupları" onClose={() => setPermsOpen(false)}>
          <p className="text-[13px] leading-relaxed text-[#475569]">
            Personel paneline giriş yetkisi rol ile verilir. Kullanıcı ekleme, rol değiştirme ve oturum kapatma yalnızca Super Admin ve Admin içindir. Super Admin atamak için Super Admin olmanız gerekir.
          </p>
          <ul className="mt-3 space-y-2 text-[12px] text-[#64748b]">
            {(Object.keys(STAFF_ROLE_LABEL) as StaffRoleId[]).map((id) => (
              <li key={id}><strong className="text-[#0f172a]">{STAFF_ROLE_LABEL[id]}:</strong> {STAFF_ROLE_HINT[id]}</li>
            ))}
          </ul>
        </Modal>
      ) : null}

      {sessionsOpen ? (
        <Modal title="Oturumları Yönet" onClose={() => setSessionsOpen(false)}>
          {sessions.length === 0 ? (
            <p className="text-[13px] text-[#94a3b8]">Aktif oturum yok.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#eef2f7] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold">{item.name}</p>
                    <p className="text-[11px] text-[#94a3b8]">{fmtWhen(item.createdAt)} · {item.email}</p>
                  </div>
                  {canManage && item.userId !== currentUserId ? (
                    <button
                      type="button"
                      className="shrink-0 text-[12px] font-bold text-[#dc2626]"
                      onClick={() => {
                        void fetch(`/api/admin/staff/sessions/${item.id}/`, { method: "DELETE" }).then((res) => {
                          if (res.ok) router.refresh();
                        });
                      }}
                    >
                      Kapat
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Modal>
      ) : null}

      {activityOpen ? (
        <Modal title="Aktiviteler" onClose={() => setActivityOpen(false)}>
          <ul className="space-y-3">
            {activities.map((item) => (
              <li key={item.id}>
                <p className="text-[13px] font-semibold">{item.text}</p>
                <p className="text-[11px] text-[#94a3b8]">{fmtWhen(item.at)}</p>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}

      {createOpen ? (
        <StaffForm
          title="Yeni kullanıcı"
          currentRole={currentRole}
          onClose={() => setCreateOpen(false)}
          onSave={async (payload) => {
            const res = await fetch("/api/admin/staff/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = (await res.json()) as { error?: string; password?: string };
            if (!res.ok) {
              setNotice(data.error || "Kaydedilemedi");
              return false;
            }
            setCreateOpen(false);
            setNotice(data.password ? `Kullanıcı oluşturuldu. Geçici şifre: ${data.password}` : "Kullanıcı oluşturuldu.");
            router.refresh();
            return true;
          }}
        />
      ) : null}

      {editUser ? (
        <StaffForm
          title="Kullanıcıyı düzenle"
          currentRole={currentRole}
          initial={editUser}
          onClose={() => setEditUser(null)}
          onSave={async (payload) => {
            const ok = await patch(editUser.id, payload);
            if (!ok) return false;
            setEditUser(null);
            router.refresh();
            return true;
          }}
        />
      ) : null}
    </div>
  );
}

function RoleDonut({ slices, total }: { slices: Array<{ color: string; count: number }>; total: number }) {
  const safe = total || 1;
  const stops = slices.reduce<string[]>((parts, slice, index) => {
    const previous = slices.slice(0, index).reduce((sum, item) => sum + item.count, 0);
    const start = (previous / safe) * 100;
    const end = ((previous + slice.count) / safe) * 100;
    parts.push(`${slice.color} ${start}% ${end}%`);
    return parts;
  }, []);
  return (
    <div
      className="relative size-[120px] shrink-0 rounded-full"
      style={{ background: stops.length ? `conic-gradient(${stops.join(",")})` : "#e2e8f0" }}
    >
      <div className="absolute inset-[18px] grid place-items-center rounded-full bg-white">
        <p className="text-[18px] font-extrabold leading-none text-[#0f172a]">{total}</p>
        <p className="mt-1 text-[10px] font-semibold text-[#94a3b8]">Toplam</p>
      </div>
    </div>
  );
}

function QuickBtn({ icon: Icon, label, onClick }: { icon: typeof UserPlus; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-[#f8fafc]">
      <span className="grid size-9 place-items-center rounded-lg bg-[#e8f0ff] text-[#2f6bff]">
        <Icon className="size-4" />
      </span>
      <span className="text-[13px] font-semibold text-[#0f172a]">{label}</span>
    </button>
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[16px] font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#94a3b8]">{k}</dt>
      <dd className="font-semibold text-[#0f172a]">{v}</dd>
    </div>
  );
}

function StaffForm({
  title,
  currentRole,
  initial,
  onClose,
  onSave,
}: {
  title: string;
  currentRole: string;
  initial?: StaffUserRow;
  onClose: () => void;
  onSave: (payload: Record<string, string>) => Promise<boolean>;
}) {
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRoleId>(initial?.role ?? "admin");
  const roles = (Object.keys(STAFF_ROLE_LABEL) as StaffRoleId[]).filter((id) => id !== "super_admin" || currentRole === "super_admin");

  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-3">
        <label className="block text-[12px] font-bold">
          Ad soyad
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
        </label>
        <label className="block text-[12px] font-bold">
          E-posta
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
        </label>
        <label className="block text-[12px] font-bold">
          {initial ? "Yeni şifre (isteğe bağlı)" : "Şifre (boş bırakılırsa üretilir)"}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
        </label>
        <label className="block text-[12px] font-bold">
          Rol
          <select value={role} onChange={(e) => setRole(e.target.value as StaffRoleId)} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px]">
            {roles.map((id) => <option key={id} value={id}>{STAFF_ROLE_LABEL[id]}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">Vazgeç</button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setPending(true);
            const payload: Record<string, string> = { name, email, role };
            if (password) payload.password = password;
            void onSave(payload).finally(() => setPending(false));
          }}
          className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </Modal>
  );
}
