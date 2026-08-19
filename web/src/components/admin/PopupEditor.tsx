"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { PopupAudienceId, PopupDeviceId, PopupKindId, PopupPlacementId, PopupRow } from "@/components/admin/popup-types";
import { POPUP_AUDIENCE_LABEL, POPUP_DEVICE_LABEL, POPUP_KIND_LABEL, POPUP_PLACEMENT_LABEL } from "@/components/admin/popup-types";

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

export function PopupEditor({
  popup,
  onClose,
  onSaved,
}: {
  popup: PopupRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState(popup?.imagePath ?? "");
  const [preview, setPreview] = useState(popup?.image ?? "");
  const [form, setForm] = useState({
    title: popup?.title ?? "",
    description: popup?.description ?? "",
    kind: (popup?.kind ?? "subscribe") as PopupKindId,
    placement: (popup?.placement ?? "home") as PopupPlacementId,
    device: (popup?.device ?? "all") as PopupDeviceId,
    audience: (popup?.audience ?? "all") as PopupAudienceId,
    heading: popup?.heading ?? "",
    body: popup?.body ?? "",
    ctaLabel: popup?.ctaLabel ?? "",
    ctaHref: popup?.ctaHref ?? "/urunler",
    couponCode: popup?.couponCode ?? "",
    startsAt: toDateInput(popup?.startsAt ?? null),
    endsAt: toDateInput(popup?.endsAt ?? null),
    delaySeconds: String(popup?.delaySeconds ?? 2),
    frequencyHours: String(popup?.frequencyHours ?? 24),
    isActive: popup?.isActive ?? true,
    isDraft: popup?.isDraft ?? false,
  });

  async function upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/popups/upload/", { method: "POST", body });
    const data = (await res.json()) as { error?: string; path?: string; url?: string };
    if (!res.ok || !data.path || !data.url) throw new Error(data.error || "Yüklenemedi");
    setImagePath(data.path);
    setPreview(data.url);
  }

  async function save() {
    setPending(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        kind: form.kind,
        placement: form.placement,
        device: form.device,
        audience: form.audience,
        imagePath,
        heading: form.heading,
        body: form.body,
        ctaLabel: form.ctaLabel,
        ctaHref: form.ctaHref,
        couponCode: form.couponCode,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        delaySeconds: Number(form.delaySeconds) || 0,
        frequencyHours: Number(form.frequencyHours) || 0,
        isActive: form.isDraft ? false : form.isActive,
        isDraft: form.isDraft,
      };
      const res = await fetch(popup ? `/api/admin/popups/${popup.id}/` : "/api/admin/popups/", {
        method: popup ? "PATCH" : "POST",
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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[18px] font-extrabold text-[#0f172a]">{popup ? "Popupı düzenle" : "Yeni popup"}</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Başlık">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Kısa açıklama">
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Tür">
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as PopupKindId })} className={inputClass}>
              {Object.entries(POPUP_KIND_LABEL).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Gösterim yeri">
            <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as PopupPlacementId })} className={inputClass}>
              {Object.entries(POPUP_PLACEMENT_LABEL).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Cihaz">
            <select value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value as PopupDeviceId })} className={inputClass}>
              {Object.entries(POPUP_DEVICE_LABEL).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Hedefleme">
            <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as PopupAudienceId })} className={inputClass}>
              {Object.entries(POPUP_AUDIENCE_LABEL).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Popup başlığı">
            <input value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} placeholder="%10 İNDİRİM" className={inputClass} />
          </Field>
          <Field label="Buton yazısı">
            <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="Abone Ol" className={inputClass} />
          </Field>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-bold text-[#334155]">Metin</span>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} className="w-full rounded-lg border border-[#dbe3ee] px-3 py-2 text-[13px] outline-none" />
          </label>
          <Field label="Buton bağlantısı">
            <input value={form.ctaHref} onChange={(e) => setForm({ ...form, ctaHref: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Kupon kodu">
            <input value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Başlangıç">
            <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Bitiş">
            <input type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Gecikme (sn)">
            <input value={form.delaySeconds} onChange={(e) => setForm({ ...form, delaySeconds: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Tekrar (saat)">
            <input value={form.frequencyHours} onChange={(e) => setForm({ ...form, frequencyHours: e.target.value })} className={inputClass} />
          </Field>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-bold text-[#334155]">Görsel (opsiyonel)</span>
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
              <span className="relative mt-2 block h-28 overflow-hidden rounded-xl border border-[#e8edf3] bg-[#f8fafc]">
                <Image src={preview} alt="" fill unoptimized className="object-cover" />
              </span>
            ) : null}
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#334155]">
            <input type="checkbox" checked={form.isActive && !form.isDraft} onChange={(e) => setForm({ ...form, isActive: e.target.checked, isDraft: e.target.checked ? false : form.isDraft })} />
            Aktif
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#334155]">
            <input type="checkbox" checked={form.isDraft} onChange={(e) => setForm({ ...form, isDraft: e.target.checked, isActive: e.target.checked ? false : form.isActive })} />
            Taslak
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
