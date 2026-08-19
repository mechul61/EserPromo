"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Box,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Eye,
  FileText,
  Globe,
  Info,
  Mail,
  Menu,
  Phone,
  RotateCcw,
  Save,
  Search,
  Share2,
  ShoppingBag,
  Truck,
  Upload,
  Wrench,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { SITE_SETTING_DEFAULTS, type SiteSettings } from "@/lib/site-settings-copy";

type Props = {
  initial: SiteSettings;
  logoPreview: string;
  faviconPreview: string;
};

const CONTROL =
  "h-11 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-[13px] font-medium text-[#0f172a] outline-none transition focus:border-[#1560ff]";
const INPUT = `mt-1.5 ${CONTROL}`;
const TEXTAREA =
  "mt-1.5 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-[13px] font-medium leading-relaxed text-[#0f172a] outline-none transition focus:border-[#1560ff]";
const LABEL = "block text-[12px] font-semibold text-[#64748b]";

export function SiteSettingsPageView({ initial, logoPreview, faviconPreview }: Props) {
  const router = useRouter();
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initial);
  const [logo, setLogo] = useState(logoPreview);
  const [favicon, setFavicon] = useState(faviconPreview);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaveHref, setLeaveHref] = useState<string | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    setForm(initial);
    setLogo(logoPreview);
    setFavicon(faviconPreview);
    dirty.current = false;
  }, [initial, logoPreview, faviconPreview]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        headerSearchRef.current?.focus();
      }
    }
    function onLeave(e: BeforeUnloadEvent) {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, []);

  function patch<K extends keyof SiteSettings>(section: K, value: Partial<SiteSettings[K]>) {
    dirty.current = true;
    setNotice(null);
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], ...value } }));
  }

  async function upload(kind: "logo" | "favicon", file: File) {
    const data = new FormData();
    data.set("file", file);
    data.set("kind", kind);
    const res = await fetch("/api/admin/settings/upload/", { method: "POST", body: data });
    const json = (await res.json()) as { error?: string; path?: string; url?: string };
    if (!res.ok || !json.path || !json.url) throw new Error(json.error || "Yüklenemedi");
    dirty.current = true;
    if (kind === "logo") {
      patch("general", { logoUrl: json.path });
      setLogo(json.url);
    } else {
      patch("general", { faviconUrl: json.path });
      setFavicon(json.url);
    }
  }

  function validate(next: SiteSettings) {
    if (!next.general.siteName.trim()) return "Site adı zorunludur.";
    if (!next.general.siteTitle.trim()) return "Site başlığı zorunludur.";
    if (!next.order.orderNumberPrefix.trim()) return "Sipariş no ön eki zorunludur.";
    if (next.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.contact.email)) {
      return "Geçerli bir e-posta adresi girin.";
    }
    return null;
  }

  async function save(next = form) {
    const invalid = validate(next);
    if (invalid) {
      setError(invalid);
      return false;
    }
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Site ayarları güncellenemedi. Lütfen tekrar deneyin.");
        return false;
      }
      dirty.current = false;
      setNotice("Site ayarları başarıyla güncellendi.");
      router.refresh();
      return true;
    } catch {
      setError("Site ayarları güncellenemedi. Lütfen tekrar deneyin.");
      return false;
    } finally {
      setPending(false);
    }
  }

  function resetDefaults() {
    dirty.current = true;
    setNotice(null);
    setForm(SITE_SETTING_DEFAULTS);
    setLogo("/brand/logo.png?v=2");
    setFavicon("/favicon.ico");
  }

  function go(href: string) {
    if (dirty.current) {
      setLeaveHref(href);
      return;
    }
    router.push(href);
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
              <Eye className="size-4" />
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
            <a href="/hesabim/bildirimler/" className="relative inline-flex size-9 items-center justify-center rounded-full bg-[#f8fafc]">
              <Bell className="size-4" />
              <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[#ef4444] text-[9px] font-extrabold text-white">
                7
              </span>
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

      <div className="mt-5">
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a]">Site Ayarları</h1>
        <p className="mt-1 text-[13px] text-[#94a3b8]">Sitenizin genel ayarlarını buradan yönetebilir ve güncelleyebilirsiniz.</p>
      </div>
      {notice ? <p className="mt-3 text-[13px] font-semibold text-[#16a34a]">{notice}</p> : null}
      {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Card icon={Globe} iconClass="bg-[#e8f0ff] text-[#2563eb]" title="Genel Bilgiler" hint="Site adı, başlık, logo ve favicon bilgilerini düzenleyin.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Site Adı" value={form.general.siteName} onChange={(value) => patch("general", { siteName: value })} />
              <Field label="Site Başlığı" value={form.general.siteTitle} onChange={(value) => patch("general", { siteTitle: value })} />
            </div>
            <div className="mt-4">
              <Field
                label="Site Açıklaması"
                value={form.general.description}
                textarea
                rows={3}
                onChange={(value) => patch("general", { description: value })}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <UploadBox
                label="Logo"
                button="Logo Yükle"
                hint="PNG, SVG veya JPG önerilir."
                src={logo}
                onFile={(file) => void upload("logo", file).catch((err: Error) => setError(err.message))}
                onClear={() => {
                  patch("general", { logoUrl: "" });
                  setLogo("/brand/logo.png?v=2");
                }}
              />
              <UploadBox
                label="Favicon"
                button="Favicon Yükle"
                hint="32x32 veya 64x64 ICO / PNG"
                src={favicon}
                compact
                onFile={(file) => void upload("favicon", file).catch((err: Error) => setError(err.message))}
                onClear={() => {
                  patch("general", { faviconUrl: "" });
                  setFavicon("/favicon.ico");
                }}
              />
            </div>
          </Card>

          <Card icon={Phone} iconClass="bg-[#e9f9ef] text-[#16a34a]" title="İletişim Bilgileri" hint="Müşterilerin size ulaşacağı iletişim kanalları.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Telefon" value={form.contact.phone} onChange={(value) => patch("contact", { phone: value })} />
              <Field label="WhatsApp" value={form.contact.whatsapp} onChange={(value) => patch("contact", { whatsapp: value })} />
              <Field label="E-posta" value={form.contact.email} onChange={(value) => patch("contact", { email: value })} />
            </div>
            <div className="mt-4">
              <Field label="Adres" value={form.contact.address} textarea rows={3} onChange={(value) => patch("contact", { address: value })} />
            </div>
            <div className="mt-4">
              <Field
                label="Google Maps Linki"
                value={form.contact.googleMapsUrl}
                onChange={(value) => patch("contact", { googleMapsUrl: value })}
              />
            </div>
          </Card>

          <Card icon={ShoppingBag} iconClass="bg-[#f1e9ff] text-[#7c3aed]" title="Sipariş Ayarları" hint="Sipariş numarası, minimum tutar ve stoksuz satış.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={LABEL}>
                Sipariş No Ön Eki
                <span className="relative mt-1.5 block">
                  <input
                    value={form.order.orderNumberPrefix}
                    onChange={(e) => patch("order", { orderNumberPrefix: e.target.value.replace(/-+$/g, "") })}
                    className={`${CONTROL} pr-10`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#94a3b8]">-</span>
                </span>
                <span className="mt-1.5 block text-[11px] font-medium text-[#94a3b8]">Örn: ESER-26-1 — yıl değişince 27 olur, sıra 1’den başlar.</span>
              </label>
              <label className={LABEL}>
                Minimum Sipariş Tutarı
                <span className="relative mt-1.5 block">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.order.minimumOrderAmount}
                    onChange={(e) => patch("order", { minimumOrderAmount: Number(e.target.value) || 0 })}
                    className={`${CONTROL} pr-12`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#94a3b8]">
                    TL
                  </span>
                </span>
                <span className="mt-1.5 block text-[11px] font-medium text-[#94a3b8]">0 girilirse sınır uygulanmaz.</span>
              </label>
              <ToggleRow label="Sipariş Notu" on={form.order.orderNoteEnabled} onChange={(value) => patch("order", { orderNoteEnabled: value })} />
              <label className={LABEL}>
                Stoksuz Ürün Siparişi
                <select
                  value={form.order.allowOutOfStockOrder ? "yes" : "no"}
                  onChange={(e) => patch("order", { allowOutOfStockOrder: e.target.value === "yes" })}
                  className={INPUT}
                >
                  <option value="no">İzin Verme</option>
                  <option value="yes">İzin Ver</option>
                </select>
              </label>
            </div>
          </Card>

          <Card icon={Box} iconClass="bg-[#fff4e5] text-[#d97706]" title="Stok Ayarları" hint="Stok takibi ve tükenince satış davranışı.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ToggleRow label="Stok Takibi" on={form.stock.stockTrackingEnabled} onChange={(value) => patch("stock", { stockTrackingEnabled: value })} />
              <label className={LABEL}>
                Stok 0 Olduğunda
                <select
                  value={form.stock.outOfStockBehavior}
                  onChange={(e) => patch("stock", { outOfStockBehavior: e.target.value === "CONTINUE_SALE" ? "CONTINUE_SALE" : "STOP_SALE" })}
                  className={INPUT}
                >
                  <option value="STOP_SALE">Satışı Durdur</option>
                  <option value="CONTINUE_SALE">Satışa Devam Et</option>
                </select>
              </label>
              <label className={LABEL}>
                Düşük Stok Limiti
                <input
                  type="number"
                  min={0}
                  value={form.stock.lowStockThreshold}
                  onChange={(e) => patch("stock", { lowStockThreshold: Number(e.target.value) || 0 })}
                  className={INPUT}
                />
              </label>
              <ToggleRow
                label="Ürün Bazlı Stok Limiti Önceliği"
                on={form.stock.productLimitPriority}
                onChange={(value) => patch("stock", { productLimitPriority: value })}
              />
            </div>
          </Card>

          <Card icon={FileText} iconClass="bg-[#e8f0ff] text-[#2563eb]" title="Fatura Bilgileri" hint="Fatura ve yasal firma bilgileri.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Firma Ünvanı" value={form.company.companyName} onChange={(value) => patch("company", { companyName: value })} />
              <Field label="Vergi Dairesi" value={form.company.taxOffice} onChange={(value) => patch("company", { taxOffice: value })} />
              <Field label="Vergi Numarası" value={form.company.taxNumber} onChange={(value) => patch("company", { taxNumber: value })} />
              <Field label="MERSİS No" value={form.company.mersisNumber} onChange={(value) => patch("company", { mersisNumber: value })} />
            </div>
            <div className="mt-4">
              <Field label="Firma Adresi" value={form.company.address} textarea rows={3} onChange={(value) => patch("company", { address: value })} />
            </div>
          </Card>

          <Card icon={Share2} iconClass="bg-[#fce7f3] text-[#db2777]" title="Sosyal Medya" hint="Boş bırakılan bağlantılar sitede gösterilmez.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Instagram" value={form.socialMedia.instagram} onChange={(value) => patch("socialMedia", { instagram: value })} />
              <Field label="Facebook" value={form.socialMedia.facebook} onChange={(value) => patch("socialMedia", { facebook: value })} />
              <Field label="X / Twitter" value={form.socialMedia.twitter} onChange={(value) => patch("socialMedia", { twitter: value })} />
              <Field label="LinkedIn" value={form.socialMedia.linkedin} onChange={(value) => patch("socialMedia", { linkedin: value })} />
              <Field label="YouTube" value={form.socialMedia.youtube} onChange={(value) => patch("socialMedia", { youtube: value })} />
              <Field label="TikTok" value={form.socialMedia.tiktok} onChange={(value) => patch("socialMedia", { tiktok: value })} />
            </div>
          </Card>

          <Card icon={Search} iconClass="bg-[#e0f2fe] text-[#0284c7]" title="SEO Ayarları" hint="Temel arama motoru bilgileri.">
            <Field label="SEO Başlığı" value={form.seo.title} onChange={(value) => patch("seo", { title: value })} />
            <div className="mt-4">
              <label className={LABEL}>
                Meta Açıklaması
                <textarea
                  value={form.seo.description}
                  onChange={(e) => patch("seo", { description: e.target.value })}
                  rows={3}
                  className={TEXTAREA}
                />
                <span className="mt-1.5 block text-right text-[11px] font-medium text-[#94a3b8]">{form.seo.description.length} / 160</span>
              </label>
            </div>
            <div className="mt-4">
              <Field label="Anahtar Kelimeler" value={form.seo.keywords} onChange={(value) => patch("seo", { keywords: value })} />
            </div>
            <div className="mt-4">
              <ToggleRow
                label="Arama motorlarının siteyi indexlemesine izin ver"
                on={form.seo.allowIndexing}
                onChange={(value) => patch("seo", { allowIndexing: value })}
              />
            </div>
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-4">
          <section className="rounded-[16px] border border-[#eef2f7] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-extrabold text-[#0f172a]">Kaydet ve İşlemler</h2>
            <p className="mt-1 text-[12px] text-[#94a3b8]">Yaptığınız değişiklikleri kaydedin.</p>
            <button
              type="button"
              disabled={pending}
              onClick={() => void save()}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1560ff] text-[13px] font-semibold text-white shadow-[0_8px_16px_rgba(21,96,255,0.22)] disabled:opacity-60"
            >
              <Save className="size-4" />
              {pending ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
            </button>
            <button
              type="button"
              onClick={resetDefaults}
              className="mt-2.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white text-[13px] font-semibold text-[#475569]"
            >
              <RotateCcw className="size-4" />
              Varsayılana Dön
            </button>
            <div className="mt-4 flex gap-2.5 rounded-xl bg-[#eff6ff] p-3.5 text-[12px] leading-relaxed text-[#1e40af]">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#1560ff] text-white">
                <Info className="size-3" />
              </span>
              Ayarlar kaydedildikten sonra sitede anında yansır. Kaydetmeden ayrılırsanız değişiklikler kaybolur.
            </div>
          </section>

          <section className="rounded-[16px] border border-[#eef2f7] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-[15px] font-extrabold text-[#0f172a]">Hızlı Erişim</h2>
            <div className="mt-3 space-y-0.5">
              <Quick href="/admin/kargo" icon={Truck} iconClass="bg-[#e9f9ef] text-[#16a34a]" label="Kargo Yönetimi" onClick={go} />
              <Quick href="/admin/odemeler" icon={CreditCard} iconClass="bg-[#fff4e5] text-[#d97706]" label="Ödeme Yöntemleri" onClick={go} />
              <Quick href="/admin/eposta" icon={Mail} iconClass="bg-[#e0f2fe] text-[#0284c7]" label="E-posta Ayarları" onClick={go} />
            </div>
          </section>

          <Card icon={Wrench} iconClass="bg-[#eef2f7] text-[#64748b]" title="Bakım Modu" hint="Açıkken ziyaretçi siteyi göremez.">
            <ToggleRow
              label="Bakım Modu"
              on={form.maintenance.enabled}
              onChange={(value) => patch("maintenance", { enabled: value })}
            />
            <div className="mt-4">
              <Field label="Bakım Başlığı" value={form.maintenance.title} onChange={(value) => patch("maintenance", { title: value })} />
            </div>
            <div className="mt-4">
              <Field
                label="Bakım Mesajı"
                value={form.maintenance.message}
                textarea
                rows={4}
                onChange={(value) => patch("maintenance", { message: value })}
              />
            </div>
          </Card>
        </aside>
      </div>

      {leaveHref ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-[16px] font-extrabold text-[#0f172a]">Kaydedilmemiş değişiklikler</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
              Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinize emin misiniz?
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setLeaveHref(null)}
                className="h-10 rounded-xl border border-[#e5e7eb] px-4 text-[13px] font-semibold text-[#475569]"
              >
                Sayfada Kal
              </button>
              <button
                type="button"
                onClick={() => {
                  dirty.current = false;
                  const href = leaveHref;
                  setLeaveHref(null);
                  router.push(href);
                }}
                className="h-10 rounded-xl bg-[#1560ff] px-4 text-[13px] font-semibold text-white"
              >
                Değişiklikleri Kaydetmeden Çık
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Card({
  icon: Icon,
  iconClass,
  title,
  hint,
  children,
}: {
  icon: typeof Globe;
  iconClass: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-[#eef2f7] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="mb-5 flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconClass}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="text-[16px] font-extrabold text-[#0f172a]">{title}</h2>
          <p className="mt-0.5 text-[12px] text-[#94a3b8]">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className={LABEL}>
      {label}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={TEXTAREA} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} />
      )}
    </label>
  );
}

function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: (value: boolean) => void }) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <div className="mt-1.5 flex h-11 items-center justify-between rounded-xl border border-[#e5e7eb] bg-white px-3">
        <span className={`text-[13px] font-semibold ${on ? "text-[#16a34a]" : "text-[#94a3b8]"}`}>{on ? "Aktif" : "Pasif"}</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => onChange(!on)}
          className={`relative h-6 w-11 rounded-full transition ${on ? "bg-[#22c55e]" : "bg-[#cbd5e1]"}`}
        >
          <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
    </div>
  );
}

function UploadBox({
  label,
  button,
  hint,
  src,
  compact,
  onFile,
  onClear,
}: {
  label: string;
  button: string;
  hint: string;
  src: string;
  compact?: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-[#e8edf3] bg-[#f8fafc] p-3">
        <div
          className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[#eef2f7] bg-white ${
            compact ? "size-16" : "h-16 w-32"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1560ff] px-3 text-[12px] font-semibold text-white"
          >
            <Upload className="size-3.5" />
            {button}
          </button>
          <button type="button" onClick={onClear} className="ml-2 text-[12px] font-semibold text-[#94a3b8] hover:text-[#64748b]">
            Kaldır
          </button>
          <p className="mt-1.5 text-[11px] text-[#94a3b8]">{hint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function Quick({
  href,
  icon: Icon,
  iconClass,
  label,
  onClick,
}: {
  href: string;
  icon: typeof Mail;
  iconClass: string;
  label: string;
  onClick: (href: string) => void;
}) {
  return (
    <button type="button" onClick={() => onClick(href)} className="flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left hover:bg-[#f8fafc]">
      <span className={`grid size-9 place-items-center rounded-lg ${iconClass}`}>
        <Icon className="size-4" />
      </span>
      <span className="flex-1 text-[13px] font-semibold text-[#0f172a]">{label}</span>
      <ChevronRight className="size-4 text-[#94a3b8]" />
    </button>
  );
}
