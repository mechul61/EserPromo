"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CouponRow } from "@/components/admin/coupon-types";

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultCouponForm() {
  const now = new Date();
  return {
    code: "",
    name: "",
    description: "",
    kind: "general",
    discountKind: "percent",
    discountValue: "10",
    minOrderAmount: "0",
    startsAt: toLocalInput(now.toISOString()),
    endsAt: toLocalInput(new Date(now.getTime() + 30 * 86400000).toISOString()),
    usageLimit: "",
    perUserLimit: "1",
    isActive: true,
    productIds: "",
  };
}

const inputClass = "h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none disabled:bg-[#f8fafc]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[12px] font-bold text-[#334155]">{label}</span>
      {children}
    </label>
  );
}

export function CouponEditor({
  coupon,
  readOnly,
  onClose,
  onSaved,
}: {
  coupon: CouponRow | null;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() =>
    coupon
      ? {
          code: coupon.code,
          name: coupon.name,
          description: coupon.description ?? "",
          kind: coupon.kind,
          discountKind: coupon.discountKind,
          discountValue: String(coupon.discountValue),
          minOrderAmount: String(coupon.minOrderAmount),
          startsAt: toLocalInput(coupon.startsAt),
          endsAt: toLocalInput(coupon.endsAt),
          usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
          perUserLimit: String(coupon.perUserLimit ?? 1),
          isActive: coupon.isActive,
          productIds: coupon.productIds.join(", "),
        }
      : defaultCouponForm(),
  );

  async function save() {
    setPending(true);
    setError(null);
    const payload = {
      code: form.code,
      name: form.name,
      description: form.description,
      kind: form.kind,
      discountKind: form.discountKind,
      discountValue: Number(form.discountValue.replace(",", ".")),
      minOrderAmount: Number(form.minOrderAmount.replace(",", ".") || "0"),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : null,
      perUserLimit: Number(form.perUserLimit || "1"),
      isActive: form.isActive,
      productIds: form.productIds
        .split(/[,\s]+/)
        .map((item) => Number(item))
        .filter((id) => Number.isInteger(id) && id > 0),
    };
    const res = await fetch(coupon ? `/api/admin/coupons/${coupon.id}/` : "/api/admin/coupons/", {
      method: coupon ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Kaydedilemedi");
      return;
    }
    onSaved();
  }

  const disabled = readOnly || pending;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-extrabold text-[#0f172a]">{readOnly ? "Kupon detayı" : coupon ? "Kuponu düzenle" : "Yeni kupon"}</h2>
            <p className="mt-1 text-[12px] text-[#94a3b8]">Kod sepet ve ödeme sayfasında büyük harfe çevrilir.</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Kupon kodu">
            <input disabled={disabled} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputClass} />
          </Field>
          <Field label="Kupon adı">
            <input disabled={disabled} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </Field>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-[12px] font-bold text-[#334155]">Açıklama</span>
            <textarea disabled={disabled} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-20 py-2`} />
          </label>
          <Field label="Tür">
            <select disabled={disabled} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as CouponRow["kind"] })} className={inputClass}>
              <option value="general">Genel</option>
              <option value="shipping">Kargo</option>
              <option value="special">Özel (üye)</option>
              <option value="product">Ürün</option>
            </select>
          </Field>
          <Field label="İndirim türü">
            <select disabled={disabled} value={form.discountKind} onChange={(e) => setForm({ ...form, discountKind: e.target.value as CouponRow["discountKind"] })} className={inputClass}>
              <option value="percent">Yüzde</option>
              <option value="amount">Tutar</option>
            </select>
          </Field>
          <Field label="İndirim değeri">
            <input disabled={disabled} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Min. sepet tutarı">
            <input disabled={disabled} value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Başlangıç">
            <input disabled={disabled} type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Bitiş">
            <input disabled={disabled} type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Toplam kullanım limiti">
            <input disabled={disabled} value={form.usageLimit} placeholder="Boş = sınırsız" onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Kişi başı limit">
            <input disabled={disabled} value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} className={inputClass} />
          </Field>
          {form.kind === "product" ? (
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[12px] font-bold text-[#334155]">Ürün ID listesi</span>
              <input disabled={disabled} value={form.productIds} onChange={(e) => setForm({ ...form, productIds: e.target.value })} placeholder="Örn. 1201, 1202" className={inputClass} />
            </label>
          ) : null}
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#334155]">
            <input disabled={disabled} type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Aktif
          </label>
        </div>
        {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">
            Kapat
          </button>
          {readOnly ? null : (
            <button type="button" disabled={pending} onClick={() => void save()} className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60">
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirm,
  extra,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  confirm?: string | null;
  extra?: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-[18px] font-extrabold text-[#0f172a]">{title}</h2>
        <p className="mt-2 text-[13px] text-[#64748b]">{message}</p>
        {extra}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">
            Vazgeç
          </button>
          {confirm && onConfirm ? (
            <button type="button" onClick={() => void onConfirm()} className="h-10 rounded-lg bg-[#dc2626] px-4 text-[13px] font-semibold text-white">
              {confirm}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
