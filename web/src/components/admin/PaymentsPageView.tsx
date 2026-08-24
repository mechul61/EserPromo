"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  Bell,
  CheckCircle2,
  ChevronDown,
  CirclePause,
  CreditCard,
  ExternalLink,
  Landmark,
  ListOrdered,
  Menu,
  Pencil,
  PieChart,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { formatPriceTry } from "@/lib/media";
import type { PaymentMethodKindId } from "@/lib/commerce/payments";

export type PaymentKpi = {
  label: string;
  value: string;
  delta?: number;
  color: string;
  icon: "total" | "active" | "passive" | "tx" | "amount";
};

export type PaymentMethodRow = {
  id: string;
  key: string;
  name: string;
  description: string;
  kind: PaymentMethodKindId;
  kindLabel: string;
  provider: string;
  providerLabel: string;
  isActive: boolean;
  sortOrder: number;
  checkoutEnabled: boolean;
};

const KPI_ICONS = {
  total: Landmark,
  active: CheckCircle2,
  passive: CirclePause,
  tx: PieChart,
  amount: Wallet,
} as const;

const KIND_ICON = {
  card: CreditCard,
  transfer: Landmark,
  wallet: Wallet,
  cod: Banknote,
} as const;

const KIND_TONE: Record<PaymentMethodKindId, string> = {
  card: "bg-[#e8f0ff] text-[#2563eb]",
  transfer: "bg-[#e9f9ef] text-[#16a34a]",
  wallet: "bg-[#f1e9ff] text-[#7c3aed]",
  cod: "bg-[#fff4e5] text-[#d97706]",
};

type TabId = "methods" | "iyzico" | "banks";

function pctFmt(value: number) {
  return Math.abs(value).toFixed(1).replace(".", ",");
}

export function PaymentsPageView({
  methods,
  kpis,
  monthCount,
  monthAmount,
  iyzicoReady,
  iyzicoUri,
  banksPanel,
}: {
  methods: PaymentMethodRow[];
  kpis: PaymentKpi[];
  monthCount: number;
  monthAmount: number;
  iyzicoReady: boolean;
  iyzicoUri: string;
  banksPanel: ReactNode;
}) {
  const router = useRouter();
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<TabId>("methods");
  const [rows, setRows] = useOptimistic(methods);
  const [edit, setEdit] = useState<PaymentMethodRow | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  const visible = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${row.name} ${row.description} ${row.providerLabel}`.toLowerCase().includes(q);
  });
  const active = rows.filter((row) => row.isActive).length;

  async function patch(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/payments/methods/${id}/`, {
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

  async function toggle(row: PaymentMethodRow) {
    if (!row.checkoutEnabled && !row.isActive) {
      setNotice("Bu sağlayıcı henüz bağlı değil. PayPal ve kapıda ödeme kasada açılamaz.");
      return;
    }
    const next = !row.isActive;
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, isActive: next } : item)));
    const ok = await patch(row.id, { isActive: next });
    if (!ok) {
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, isActive: row.isActive } : item)));
      return;
    }
    router.refresh();
  }

  async function saveSort() {
    const res = await fetch("/api/admin/payments/sort/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: rows.map((row) => ({ id: row.id, sortOrder: row.sortOrder })) }),
    });
    if (!res.ok) {
      setNotice("Sıralama kaydedilemedi");
      return;
    }
    setNotice("Ödeme sırası güncellendi. Müşteri kasada bu sırayı görür.");
    router.refresh();
  }

  function addMethod() {
    if (!iyzicoReady) {
      setTab("iyzico");
      setNotice("Kart ödemesi için önce Iyzico anahtarlarını kaydedin.");
      return;
    }
    setTab("banks");
    setNotice("Havale için EFT hesabı ekleyin. Yeni sağlayıcı (PayPal vb.) henüz bağlı değil.");
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
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
          <h1 className="text-[28px] font-extrabold text-[#0f172a]">Ödeme Yöntemleri</h1>
          <p className="mt-1 text-[13px] text-[#94a3b8]">Mağazanızda kullanılacak ödeme yöntemlerini yönetin.</p>
        </div>
        <button type="button" onClick={addMethod} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
          <Plus className="size-4" />
          Yeni Yöntem Ekle
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

      <div className="mt-4 flex gap-6 border-b border-[#e8edf3]">
        {([
          ["methods", "1. Ödeme Yöntemleri"],
          ["iyzico", "2. Iyzico Ayarları"],
          ["banks", "3. EFT/Havale Hesapları"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`-mb-px border-b-[3px] py-3 text-[14px] font-bold ${tab === id ? "border-[#2f6bff] text-[#2f6bff]" : "border-transparent text-[#94a3b8]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "methods" ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className="rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-extrabold text-[#0f172a]">Ödeme Yöntemleri Listesi</h2>
                <p className="mt-1 text-[12px] text-[#94a3b8]">Aktif yöntemler kasa sayfasında bu sırayla görünür.</p>
              </div>
              <button type="button" onClick={() => void saveSort()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e8edf3] px-3.5 text-[13px] font-semibold text-[#475569]">
                <ListOrdered className="size-4" />
                Sıralamayı Güncelle
              </button>
            </div>
            <div className="overflow-x-auto overflow-y-hidden">
              <table className="min-w-[760px] w-full text-left text-[13px]">
                <thead className="border-b border-[#eef2f7] text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">
                  <tr>
                    <th className="px-3 py-3">Yöntem Adı</th>
                    <th className="px-3 py-3">Tür</th>
                    <th className="px-3 py-3">Sağlayıcı</th>
                    <th className="px-3 py-3">Durum</th>
                    <th className="px-3 py-3">Sıralama</th>
                    <th className="px-3 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const Icon = KIND_ICON[row.kind];
                    return (
                    <tr key={row.id} className="border-b border-[#f1f5f9] last:border-0">
                      <td className="px-3 py-4">
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl ${KIND_TONE[row.kind]}`}>
                            <Icon className="size-4" />
                          </span>
                          <div>
                            <p className="font-bold text-[#0f172a]">{row.name}</p>
                            <p className="text-[12px] text-[#94a3b8]">{row.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${KIND_TONE[row.kind]}`}>{row.kindLabel}</span>
                      </td>
                      <td className="px-3 py-4">
                        {row.provider === "iyzico" ? (
                          <span className="text-[13px] font-black tracking-wide text-[#2563eb]">iyzico</span>
                        ) : row.provider === "paypal" ? (
                          <span className="text-[13px] font-black tracking-wide text-[#003087]">PayPal</span>
                        ) : (
                          <span className="font-semibold text-[#64748b]">{row.providerLabel}</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void toggle(row)}
                            className={`relative h-6 w-11 rounded-full ${row.isActive ? "bg-[#22c55e]" : "bg-[#cbd5e1]"}`}
                            aria-label={row.isActive ? "Pasifleştir" : "Aktifleştir"}
                          >
                            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow ${row.isActive ? "right-0.5" : "left-0.5"}`} />
                          </button>
                          <span className={`text-[12px] font-bold ${row.isActive ? "text-[#16a34a]" : "text-[#94a3b8]"}`}>
                            {row.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <input
                          type="number"
                          min={1}
                          max={rows.length}
                          value={row.sortOrder}
                          onChange={(e) => setRows((current) => current.map((item) => (item.id === row.id ? { ...item, sortOrder: Number(e.target.value) || 1 } : item)))}
                          className="h-9 w-16 rounded-lg border border-[#dbe3ee] px-2 text-center text-[13px] outline-none"
                        />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" onClick={() => setEdit(row)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e8edf3] px-2.5 text-[12px] font-semibold text-[#475569]">
                            <Pencil className="size-3.5" />
                            Düzenle
                          </button>
                          <span className="grid size-8 place-items-center rounded-lg text-[#ef4444]" title="Sistem yöntemleri silinemez">
                            <Trash2 className="size-4" />
                          </span>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 rounded-xl bg-[#eef4ff] px-4 py-3 text-[12px] leading-relaxed text-[#1e3a8a]">
              Listedeki sıralama, müşterinin ödeme adımında göreceği sırayı belirler. Değişikliği kaydetmek için “Sıralamayı Güncelle”ye basın.
            </p>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Hızlı Bilgiler</h2>
              <ul className="space-y-2.5 text-[13px]">
                <li className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[#64748b]"><CheckCircle2 className="size-4 text-[#22c55e]" /> Aktif yöntem</span>
                  <span className="font-bold">{active}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[#64748b]"><CirclePause className="size-4 text-[#f59e0b]" /> Pasif yöntem</span>
                  <span className="font-bold">{rows.length - active}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[#64748b]"><PieChart className="size-4 text-[#7c3aed]" /> Bu ay işlem</span>
                  <span className="font-bold">{monthCount.toLocaleString("tr-TR")}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-[#64748b]"><Wallet className="size-4 text-[#ec4899]" /> Bu ay tutar</span>
                  <span className="font-bold">₺{formatPriceTry(monthAmount)}</span>
                </li>
              </ul>
            </section>
            <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <h2 className="mb-3 text-[12px] font-extrabold tracking-wide text-[#94a3b8] uppercase">Desteklenen Ödeme Türleri</h2>
              <ul className="space-y-2 text-[13px]">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#22c55e]" /> Kredi Kartı / Banka Kartı</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#22c55e]" /> Banka Transferi (EFT/Havale)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#22c55e]" /> Kapıda Ödeme</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#22c55e]" /> Dijital Cüzdanlar</li>
              </ul>
            </section>
            <section className="rounded-[18px] bg-[#eef4ff] p-4">
              <h2 className="text-[13px] font-extrabold text-[#1e3a8a]">Yardım</h2>
              <p className="mt-2 text-[12px] text-[#334155]">Iyzico anahtarları ve havale hesapları bu sayfadaki sekmelerden yönetilir.</p>
              <button type="button" onClick={() => setHelpOpen(true)} className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#2f6bff]">
                Dokümantasyonu İnceleyin
                <ArrowRight className="size-3.5" />
              </button>
            </section>
          </aside>
        </div>
      ) : null}

      {tab === "iyzico" ? <IyzicoPanel initialUri={iyzicoUri} ready={iyzicoReady} onSaved={() => router.refresh()} /> : null}
      {tab === "banks" ? <div className="mt-4 rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">{banksPanel}</div> : null}

      {edit ? (
        <MethodEditor
          method={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            router.refresh();
          }}
        />
      ) : null}
      {helpOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <div className="flex items-start justify-between">
              <h2 className="text-[16px] font-extrabold">Ödeme rehberi</h2>
              <button type="button" onClick={() => setHelpOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-[13px] text-[#334155]">
              <li>Kredi kartı Iyzico üzerindendir; kart numarası sitede saklanmaz.</li>
              <li>Anahtarları Iyzico panelinden alıp 2. sekmeye kaydedin.</li>
              <li>Havale / EFT için 3. sekmeden IBAN tanımlayın. Müşteri yalnızca açık hesapları görür.</li>
              <li>PayPal ve kapıda ödeme bu sitede yok; eklenmeden kasada çıkmaz.</li>
            </ul>
            <button type="button" onClick={() => { setHelpOpen(false); setTab("iyzico"); }} className="mt-4 h-10 w-full rounded-lg bg-[#2f6bff] text-[13px] font-semibold text-white">Iyzico ayarlarına git</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MethodEditor({ method, onClose, onSaved }: { method: PaymentMethodRow; onClose: () => void; onSaved: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: method.name, description: method.description, isActive: method.isActive });

  async function save() {
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/payments/methods/${method.id}/`, {
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
          <h2 className="text-[16px] font-extrabold">Yöntemi düzenle</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]"><X className="size-4" /></button>
        </div>
        <label className="mt-4 block text-[12px] font-bold">
          Ad
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
        </label>
        <label className="mt-3 block text-[12px] font-bold">
          Açıklama
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
        </label>
        <label className="mt-3 flex items-center gap-2 text-[13px] font-semibold">
          <input
            type="checkbox"
            checked={form.isActive}
            disabled={!method.checkoutEnabled}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Aktif (kasada göster)
        </label>
        {!method.checkoutEnabled ? (
          <p className="mt-2 text-[12px] text-[#d97706]">Bu sağlayıcı henüz bağlı değil; kasada açılamaz.</p>
        ) : null}
        {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">Vazgeç</button>
          <button type="button" disabled={pending} onClick={() => void save()} className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60">{pending ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
      </div>
    </div>
  );
}

function IyzicoPanel({ initialUri, ready, onSaved }: { initialUri: string; ready: boolean; onSaved: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ uri: initialUri, apiKey: "", secretKey: "" });

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/payments/iyzico/");
      const data = (await res.json()) as { uri?: string; apiKey?: string; secretKey?: string };
      setForm({
        uri: data.uri || initialUri,
        apiKey: data.apiKey || "",
        secretKey: data.secretKey || "",
      });
    })();
  }, [initialUri]);

  async function save() {
    setPending(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/admin/payments/iyzico/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = (await res.json()) as { error?: string; ready?: boolean };
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Kaydedilemedi");
      return;
    }
    setMessage(data.ready ? "Iyzico anahtarları kaydedildi." : "Kaydedildi. API key ve secret eksikse kart ödemesi açılmaz.");
    onSaved();
  }

  return (
    <section className="mt-4 max-w-xl rounded-[18px] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-extrabold">Iyzico ayarları</h2>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ready ? "bg-[#e9f9ef] text-[#16a34a]" : "bg-[#fff4e5] text-[#d97706]"}`}>
          {ready ? "Yapılandırıldı" : "Eksik"}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-[#94a3b8]">Kart verisi bu sunucuya gelmez. Anahtarları Iyzico panelinden alın.</p>
      <p className="mt-2 rounded-lg bg-[#f8fafc] px-3 py-2 text-[11px] leading-relaxed text-[#64748b]">
        Callback URL (Iyzico panelinde tanımlı olmalı):{" "}
        <span className="font-semibold text-[#334155]">https://eserpromo.com/api/payments/iyzico/callback/</span>
      </p>
      <label className="mt-4 block text-[12px] font-bold">
        API adresi
        <select value={form.uri} onChange={(e) => setForm({ ...form, uri: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none">
          <option value="https://sandbox-api.iyzipay.com">Sandbox (test)</option>
          <option value="https://api.iyzipay.com">Canlı (production)</option>
          {form.uri && form.uri !== "https://sandbox-api.iyzipay.com" && form.uri !== "https://api.iyzipay.com" ? (
            <option value={form.uri}>{form.uri}</option>
          ) : null}
        </select>
      </label>
      <label className="mt-3 block text-[12px] font-bold">
        API Key
        <input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="IYZICO_API_KEY" className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
      </label>
      <label className="mt-3 block text-[12px] font-bold">
        Secret Key
        <input value={form.secretKey} onChange={(e) => setForm({ ...form, secretKey: e.target.value })} placeholder="IYZICO_SECRET_KEY" className="mt-1 h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none" />
      </label>
      {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
      {message ? <p className="mt-3 text-[13px] font-semibold text-[#16a34a]">{message}</p> : null}
      <button type="button" disabled={pending} onClick={() => void save()} className="mt-4 h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60">
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </section>
  );
}
