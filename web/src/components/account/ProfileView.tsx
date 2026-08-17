"use client";

import Image from "next/image";
import { useState } from "react";
import { Camera } from "lucide-react";
import { formatPhoneTR, isValidTRPhone, phoneDigits } from "@/lib/phone";

const inputClass =
  "mt-1 block h-11 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-orange disabled:bg-[#f7f8fa] disabled:text-[#888]";

export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  avatarUrl: string;
  companyName: string;
  companyTitle: string;
  taxOffice: string;
  taxNumber: string;
  tcKimlik: string;
  useCorporateDefault: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyOrder: boolean;
};

export function ProfileView({ initial }: { initial: ProfileFormValues }) {
  const [form, setForm] = useState(initial);
  const [pending, setPending] = useState<"profile" | "prefs" | "photo" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile() {
    if (form.firstName.trim().length < 2) {
      setError("Ad girin");
      return;
    }
    if (form.lastName.trim().length < 2) {
      setError("Soyad girin");
      return;
    }
    if (!isValidTRPhone(form.phone)) {
      setError("Geçerli bir telefon numarası girin");
      return;
    }
    setPending("profile");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: phoneDigits(form.phone),
          birthDate: form.birthDate || null,
          gender: form.gender || null,
          companyName: form.companyName,
          companyTitle: form.companyTitle,
          taxOffice: form.taxOffice,
          taxNumber: form.taxNumber,
          tcKimlik: form.tcKimlik.replace(/\D/g, "").slice(0, 11),
          useCorporateDefault: form.useCorporateDefault,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi");
        return;
      }
      setMessage("Bilgileriniz güncellendi.");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(null);
    }
  }

  async function savePrefs() {
    setPending("prefs");
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyEmail: form.notifyEmail,
          notifySms: form.notifySms,
          notifyOrder: form.notifyOrder,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi");
        return;
      }
      setMessage("Tercihleriniz kaydedildi.");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(null);
    }
  }

  async function uploadPhoto(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setError("Fotoğraf en fazla 2MB olabilir");
      return;
    }
    setPending("photo");
    setError(null);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/account/avatar", { method: "POST", body });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "Fotoğraf yüklenemedi");
        return;
      }
      setField("avatarUrl", `${data.url}?t=${Date.now()}`);
      setMessage("Fotoğraf güncellendi.");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-5">
      {error ? <p className="text-[13px] text-brand-red">{error}</p> : null}
      {message ? <p className="text-[13px] text-brand-green">{message}</p> : null}

      <section className="rounded-md border border-line bg-white p-5">
        <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Kişisel Bilgiler</h2>
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-[12px] font-bold text-[#555]">
              Ad *
              <input
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-[12px] font-bold text-[#555]">
              Soyad *
              <input
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-[12px] font-bold text-[#555]">
              E-posta *
              <input value={form.email} disabled className={inputClass} />
            </label>
            <label className="block text-[12px] font-bold text-[#555]">
              Telefon *
              <input
                type="tel"
                placeholder="0 (5__) ___ __ __"
                value={form.phone}
                onChange={(e) => setField("phone", formatPhoneTR(e.target.value))}
                className={inputClass}
              />
            </label>
            <label className="block text-[12px] font-bold text-[#555]">
              Doğum Tarihi
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => setField("birthDate", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-[12px] font-bold text-[#555]">
              Cinsiyet
              <select
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
                className={inputClass}
              >
                <option value="">Seçiniz</option>
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
                <option value="other">Belirtmek istemiyorum</option>
              </select>
            </label>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-full border border-line bg-soft">
              {form.avatarUrl ? (
                <Image src={form.avatarUrl} alt="" fill unoptimized className="object-cover" />
              ) : (
                <Camera className="size-8 text-[#b0b4ba]" />
              )}
            </div>
            <p className="mt-2 text-[11px] text-[#8b919a]">JPG, PNG veya GIF. Maks. 2MB</p>
            <label className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-md border border-line px-4 text-[11px] font-extrabold tracking-wide text-navy hover:bg-soft">
              Fotoğraf Yükle
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPhoto(file);
                }}
              />
            </label>
          </div>
        </div>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void saveProfile()}
          className="mt-5 h-11 rounded-md bg-orange px-6 text-[13px] font-extrabold tracking-wide text-[#111] hover:bg-orange-hover disabled:opacity-60"
        >
          {pending === "profile" ? "Kaydediliyor…" : "Bilgileri Güncelle"}
        </button>
      </section>

      <section className="rounded-md border border-line bg-white p-5">
        <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Kurumsal Bilgiler</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-[12px] font-bold text-[#555]">
            Firma Adı
            <input
              value={form.companyName}
              onChange={(e) => setField("companyName", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-[12px] font-bold text-[#555]">
            Firma Ünvanı
            <input
              value={form.companyTitle}
              onChange={(e) => setField("companyTitle", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-[12px] font-bold text-[#555]">
            Vergi Dairesi
            <input
              value={form.taxOffice}
              onChange={(e) => setField("taxOffice", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-[12px] font-bold text-[#555]">
            Vergi Numarası
            <input
              value={form.taxNumber}
              onChange={(e) => setField("taxNumber", e.target.value.replace(/\D/g, "").slice(0, 11))}
              className={inputClass}
            />
          </label>
          <label className="block text-[12px] font-bold text-[#555] sm:col-span-2">
            TC Kimlik Numarası
            <input
              value={form.tcKimlik}
              onChange={(e) => setField("tcKimlik", e.target.value.replace(/\D/g, "").slice(0, 11))}
              className={inputClass}
            />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-[13px] text-[#333]">
          <input
            type="checkbox"
            checked={form.useCorporateDefault}
            onChange={(e) => setField("useCorporateDefault", e.target.checked)}
          />
          Kurumsal fatura bilgilerini varsayılan kullan
        </label>
      </section>

      <section className="rounded-md border border-line bg-white p-5">
        <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">İletişim Tercihleri</h2>
        <div className="mt-4 space-y-3 text-[13px] text-[#333]">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.notifyEmail}
              onChange={(e) => setField("notifyEmail", e.target.checked)}
            />
            Kampanya ve yenilik e-postaları
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.notifySms}
              onChange={(e) => setField("notifySms", e.target.checked)}
            />
            SMS bildirimleri
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.notifyOrder}
              onChange={(e) => setField("notifyOrder", e.target.checked)}
            />
            Sipariş ve teslimat bildirimleri
          </label>
        </div>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void savePrefs()}
          className="mt-5 h-11 rounded-md border border-line bg-white px-6 text-[13px] font-extrabold tracking-wide text-navy hover:bg-soft disabled:opacity-60"
        >
          {pending === "prefs" ? "Kaydediliyor…" : "Tercihleri Kaydet"}
        </button>
      </section>
    </div>
  );
}
