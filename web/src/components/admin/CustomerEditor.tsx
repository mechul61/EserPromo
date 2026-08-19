"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CustomerGroupId, CustomerRow, CustomerSourceId } from "@/components/admin/customer-types";

const inputClass = "h-11 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none disabled:bg-[#f8fafc]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[12px] font-bold text-[#334155]">{label}</span>
      {children}
    </label>
  );
}

export function CustomerEditor({
  customer,
  onClose,
  onSaved,
}: {
  customer: CustomerRow | null;
  onClose: () => void;
  onSaved: (password?: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone === "—" ? "" : customer?.phone ?? "",
    city: customer?.city ?? "",
    customerGroup: (customer?.customerGroup ?? "retail") as CustomerGroupId,
    source: (customer?.source ?? "website") as CustomerSourceId,
    isActive: customer?.isActive ?? true,
    blocked: customer?.blocked ?? false,
    password: "",
  });

  async function save() {
    setPending(true);
    setError(null);
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      city: form.city,
      customerGroup: form.customerGroup,
      source: form.source,
      isActive: form.isActive,
      blocked: form.blocked,
      ...(form.password.trim() ? { password: form.password } : {}),
    };
    const res = await fetch(customer ? `/api/admin/users/${customer.id}/` : "/api/admin/users/", {
      method: customer ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; password?: string };
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Kaydedilemedi");
      return;
    }
    onSaved(data.password);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-extrabold text-[#0f172a]">{customer ? "Müşteriyi düzenle" : "Yeni müşteri"}</h2>
            <p className="mt-1 text-[12px] text-[#94a3b8]">
              {customer ? "İletişim ve segment bilgilerini güncelleyin." : "Şifre boş bırakılırsa sistem üretir."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-[#f8fafc]">
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Ad soyad">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="E-posta">
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Telefon">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Şehir">
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Grup">
            <select value={form.customerGroup} onChange={(e) => setForm({ ...form, customerGroup: e.target.value as CustomerGroupId })} className={inputClass}>
              <option value="retail">Perakende</option>
              <option value="wholesale">Toptan</option>
              <option value="vip">VIP</option>
            </select>
          </Field>
          <Field label="Kaynak">
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as CustomerSourceId })} className={inputClass}>
              <option value="website">Web Sitesi</option>
              <option value="social">Sosyal Medya</option>
              <option value="email">E-posta Kampanyası</option>
              <option value="other">Diğer</option>
            </select>
          </Field>
          <Field label={customer ? "Yeni şifre (opsiyonel)" : "Şifre (opsiyonel)"}>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#334155]">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Aktif
          </label>
          <label className="flex items-center gap-2 text-[13px] font-semibold text-[#334155]">
            <input type="checkbox" checked={form.blocked} onChange={(e) => setForm({ ...form, blocked: e.target.checked })} />
            Engelli
          </label>
        </div>
        {error ? <p className="mt-3 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#e8edf3] px-4 text-[13px] font-semibold">
            Vazgeç
          </button>
          <button type="button" disabled={pending} onClick={() => void save()} className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white disabled:opacity-60">
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  extra,
  confirm,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  extra?: React.ReactNode;
  confirm?: string | null;
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
            <button type="button" onClick={() => void onConfirm()} className="h-10 rounded-lg bg-[#2f6bff] px-4 text-[13px] font-semibold text-white">
              {confirm}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
