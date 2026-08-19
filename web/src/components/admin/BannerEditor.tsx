"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { BannerKindId, BannerPlacementId, BannerRow } from "@/components/admin/banner-types";
import { BANNER_KIND_LABEL, BANNER_PLACEMENT_LABEL } from "@/components/admin/banner-types";

const inputClass = "h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none disabled:bg-[#f8fafc]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[12px] font-bold text-[#334155]">{label}</span>
      {children}
    </label>
  );
}

function toDateInput(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function BannerEditor({
  banner,
  defaultKind,
  onClose,
  onSaved,
}: {
  banner: BannerRow | null;
  defaultKind?: BannerKindId;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState(banner?.imagePath ?? "");
  const [preview, setPreview] = useState(banner?.image ?? "");
  const [form, setForm] = useState({
    title: banner?.title ?? "",
    href: banner?.href ?? "",
    kind: (banner?.kind ?? defaultKind ?? "banner") as BannerKindId,
    placement: (banner?.placement ?? (defaultKind === "slider" ? "hero" : "middle_1")) as BannerPlacementId,
    width: String(banner?.width ?? 1920),
    height: String(banner?.height ?? 600),
    sortOrder: String(banner?.sortOrder ?? 0),
    isActive: banner?.isActive ?? true,
    startsAt: toDateInput(banner?.startsAt ?? null),
    endsAt: toDateInput(banner?.endsAt ?? null),
    minAmount: banner ? String(banner.minAmount) : "0",
    maxAmount: banner ? String(banner.maxAmount) : "0",
  });

  async function upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/banners/upload/", { method: "POST", body });
    const data = (await res.json()) as { error?: string; path?: string; url?: string };
    if (!res.ok || !data.path || !data.url) throw new Error(data.error || "Yüklenemedi");
    setImagePath(data.path);
    setPreview(data.url);
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      if (!imagePath) throw new Error("Görsel yükleyin");
      const minAmount = Number(form.minAmount.replace(",", ".") || "0") || 0;
      const maxAmount = Number(form.maxAmount.replace(",", ".") || "0") || 0;
      if (minAmount > 0 && maxAmount > 0 && minAmount > maxAmount) {
        throw new Error("Min. para sınırı, max. paradan büyük olamaz");
      }
      const payload = {
        title: form.title,
        href: form.href,
        kind: form.kind,
        placement: form.placement,
        imagePath,
        width: Number(form.width) || 1920,
        height: Number(form.height) || 600,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        minAmount,
        maxAmount,
      };
      const res = await fetch(banner ? `/api/admin/banners/${banner.id}/` : "/api/admin/banners/", {
        method: banner ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[18px] font-extrabold text-[#0f172a]">
            {banner
              ? form.kind === "slider"
                ? "Sliderı düzenle"
                : "Bannerı düzenle"
              : form.kind === "slider"
                ? "Yeni slider"
                : "Yeni banner"}
          </h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-bold text-[#334155]">Görsel</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload(file).catch((err) => setError(err instanceof Error ? err.message : "Yüklenemedi"));
              }}
              className="text-[13px]"
            />
            {preview ? (
              <span className="relative mt-2 block h-32 overflow-hidden rounded-xl border border-[#e8edf3] bg-[#f8fafc]">
                <Image src={preview} alt="" fill unoptimized className="object-cover" />
              </span>
            ) : null}
          </label>
          <Field label="Başlık">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Bağlantı">
            <input value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} placeholder="/urunler" className={inputClass} />
          </Field>
          <Field label="Tür">
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as BannerKindId })} className={inputClass}>
              {Object.entries(BANNER_KIND_LABEL).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Konum">
            <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as BannerPlacementId })} className={inputClass}>
              {Object.entries(BANNER_PLACEMENT_LABEL).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Genişlik">
            <input value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Yükseklik">
            <input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Başlangıç">
            <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Bitiş">
            <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Min. para sınırı">
            <span className="relative block">
              <input
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                className={`${inputClass} pr-12`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#94a3b8]">TL</span>
            </span>
            <span className="mt-1 block text-[11px] font-medium text-[#94a3b8]">0 = alt sınır yok</span>
          </Field>
          <Field label="Max. para sınırı">
            <span className="relative block">
              <input
                value={form.maxAmount}
                onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                className={`${inputClass} pr-12`}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#94a3b8]">TL</span>
            </span>
            <span className="mt-1 block text-[11px] font-medium text-[#94a3b8]">0 = üst sınır yok</span>
          </Field>
          <Field label="Sıralama">
            <input value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#334155]">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Aktif
          </label>
        </div>
        {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">Vazgeç</button>
          <button type="button" disabled={pending} onClick={() => void save()} className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60">
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
