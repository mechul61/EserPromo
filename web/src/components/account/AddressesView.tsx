"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhoneTR, isValidTRPhone, phoneDigits } from "@/lib/phone";
import { CityDistrictFields } from "@/components/forms/CityDistrictFields";

const inputClass =
  "mt-1 block h-11 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-orange";

export type AddressItem = {
  id: string;
  title: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  district: string;
  postalCode: string;
  line: string;
  isDefault: boolean;
};

type FormState = Omit<AddressItem, "id" | "isDefault"> & { isDefault: boolean };

const emptyForm = (email: string): FormState => ({
  title: "Teslimat",
  fullName: "",
  email,
  phone: "",
  country: "Türkiye",
  city: "İstanbul",
  district: "",
  postalCode: "",
  line: "",
  isDefault: false,
});

function toForm(address: AddressItem, fallbackEmail: string): FormState {
  return {
    title: address.title,
    fullName: address.fullName,
    email: address.email || fallbackEmail,
    phone: formatPhoneTR(address.phone) || address.phone,
    country: address.country || "Türkiye",
    city: address.city,
    district: address.district,
    postalCode: address.postalCode,
    line: address.line,
    isDefault: address.isDefault,
  };
}

export function AddressesView({
  initial,
  userEmail,
}: {
  initial: AddressItem[];
  userEmail: string;
}) {
  const router = useRouter();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(userEmail));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = useMemo(
    () => initial.filter((item) => !removedIds.has(item.id)),
    [initial, removedIds],
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startNew() {
    setError(null);
    setForm({ ...emptyForm(userEmail), isDefault: items.length === 0 });
    setEditingId("new");
  }

  function startEdit(address: AddressItem) {
    setError(null);
    setForm(toForm(address, userEmail));
    setEditingId(address.id);
  }

  function cancel() {
    setEditingId(null);
    setError(null);
  }

  function validate() {
    if (form.title.trim().length < 2) return "Adres başlığı girin";
    if (form.fullName.trim().length < 2) return "Ad soyad girin";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Geçerli bir e-posta girin";
    }
    if (!isValidTRPhone(form.phone)) return "Geçerli bir telefon girin";
    if (form.district.trim().length < 2) return "İlçe girin";
    if (form.line.trim().length < 6) return "Adres girin";
    return null;
  }

  async function save() {
    const issue = validate();
    if (issue) {
      setError(issue);
      return;
    }
    setPending(true);
    setError(null);
    const payload = {
      ...form,
      phone: phoneDigits(form.phone),
    };
    try {
      const isNew = editingId === "new";
      const res = await fetch(isNew ? "/api/account/addresses" : `/api/account/addresses/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi");
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Bu adresi silmek istiyor musunuz?")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Silinemedi");
        return;
      }
      setRemovedIds((prev) => new Set(prev).add(id));
      if (editingId === id) setEditingId(null);
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  const fields = (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="block text-[12px] font-bold text-[#555]">
        Adres Başlığı
        <input value={form.title} onChange={(e) => setField("title", e.target.value)} className={inputClass} placeholder="Ev, İş, Teslimat" />
      </label>
      <label className="block text-[12px] font-bold text-[#555]">
        Ad Soyad
        <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} className={inputClass} />
      </label>
      <label className="block text-[12px] font-bold text-[#555]">
        E-posta
        <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputClass} />
      </label>
      <label className="block text-[12px] font-bold text-[#555]">
        Telefon
        <input
          type="tel"
          placeholder="0 (5__) ___ __ __"
          value={form.phone}
          onChange={(e) => setField("phone", formatPhoneTR(e.target.value))}
          className={inputClass}
        />
      </label>
      <label className="block text-[12px] font-bold text-[#555]">
        Ülke
        <input value={form.country} onChange={(e) => setField("country", e.target.value)} className={inputClass} />
      </label>
      <CityDistrictFields
        city={form.city}
        district={form.district}
        onCity={(value) => setField("city", value)}
        onDistrict={(value) => setField("district", value)}
        inputClass={inputClass}
        cityClassName="block text-[12px] font-bold text-[#555]"
        districtClassName="block text-[12px] font-bold text-[#555]"
      />
      <label className="block text-[12px] font-bold text-[#555]">
        Posta Kodu
        <input value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} className={inputClass} />
      </label>
      <label className="block text-[12px] font-bold text-[#555] sm:col-span-2">
        Adres
        <textarea
          value={form.line}
          onChange={(e) => setField("line", e.target.value)}
          className="mt-1 block h-24 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-orange"
        />
      </label>
      <label className="flex items-center gap-2 text-[13px] font-medium text-[#333] sm:col-span-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setField("isDefault", e.target.checked)}
        />
        Varsayılan adres olarak kullan
      </label>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={startNew}
          disabled={pending || editingId === "new"}
          className="h-11 rounded-md bg-orange px-5 text-[13px] font-extrabold tracking-wide text-[#111] hover:bg-orange-hover disabled:opacity-60"
        >
          Yeni Adres Ekle
        </button>
      </div>

      {error ? <p className="text-[13px] text-brand-red">{error}</p> : null}

      {editingId ? (
        <section className="rounded-md border border-line bg-white p-5">
          <h2 className="text-[14px] font-extrabold tracking-wide text-navy uppercase">
            {editingId === "new" ? "Yeni Adres" : "Adresi Düzenle"}
          </h2>
          {fields}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => void save()}
              className="h-11 rounded-md bg-orange px-5 text-[13px] font-extrabold tracking-wide text-[#111] hover:bg-orange-hover disabled:opacity-60"
            >
              {pending ? "Kaydediliyor…" : editingId === "new" ? "Kaydet" : "Güncelle"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={cancel}
              className="h-11 rounded-md border border-line px-5 text-[13px] font-extrabold tracking-wide text-navy hover:bg-soft"
            >
              Vazgeç
            </button>
          </div>
        </section>
      ) : null}

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((address) => (
          <li
            key={address.id}
            className={`flex min-h-[280px] flex-col rounded-md border bg-white p-4 shadow-sm ${
              address.isDefault ? "border-orange" : "border-line"
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-[13px] font-extrabold tracking-wide text-navy uppercase">{address.title}</p>
              {address.isDefault ? (
                <span className="shrink-0 rounded bg-[#fff8f0] px-2 py-0.5 text-[10px] font-bold text-orange">
                  Varsayılan
                </span>
              ) : null}
            </div>
            <dl className="min-w-0 flex-1 space-y-2">
              <CardRow label="Ad Soyad" value={address.fullName} />
              <CardRow label="E-posta" value={address.email || userEmail} />
              <CardRow label="Telefon" value={formatPhoneTR(address.phone) || address.phone} />
              <CardRow label="Ülke" value={address.country || "Türkiye"} />
              <CardRow label="Şehir" value={address.city} />
              <CardRow label="İlçe" value={address.district} />
              <CardRow label="Posta Kodu" value={address.postalCode} />
              <CardRow label="Adres" value={address.line} />
            </dl>
            <div className="mt-4 flex gap-2 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => startEdit(address)}
                className="h-9 flex-1 rounded-md border border-line text-[12px] font-extrabold tracking-wide text-navy hover:bg-soft"
              >
                Düzenle
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => void remove(address.id)}
                className="h-9 flex-1 rounded-md border border-line text-[12px] font-extrabold tracking-wide text-brand-red hover:bg-soft"
              >
                Sil
              </button>
            </div>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={startNew}
            disabled={pending}
            className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-md border border-dashed border-[#c5c9ce] bg-[#fafbfc] px-4 text-center hover:border-orange hover:bg-[#fff8f0]"
          >
            <span className="text-[28px] leading-none font-light text-navy">+</span>
            <span className="mt-2 text-[13px] font-extrabold tracking-wide text-navy uppercase">Yeni Adres</span>
            <span className="mt-1 text-[12px] text-[#6b7280]">Panoya yeni kart ekleyin</span>
          </button>
        </li>
      </ul>
    </div>
  );
}

function CardRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <dt className="text-[10px] font-bold tracking-wide text-[#8b919a] uppercase">{label}</dt>
      <dd className="mt-0.5 text-[13px] leading-snug font-semibold break-words text-[#111]">{value}</dd>
    </div>
  );
}
