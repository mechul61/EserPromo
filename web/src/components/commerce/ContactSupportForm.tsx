"use client";

import { useState } from "react";
import { RecaptchaField } from "@/components/commerce/RecaptchaField";
import { SUPPORT_CATEGORY_LABEL, type SupportCategoryId } from "@/lib/commerce/support-copy";

export function ContactSupportForm({
  recaptchaEnabled = true,
  recaptchaSiteKey = "",
  defaultName = "",
  defaultEmail = "",
  defaultPhone = "",
}: {
  recaptchaEnabled?: boolean;
  recaptchaSiteKey?: string;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState("");
  const [category, setCategory] = useState<SupportCategoryId>("other");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (recaptchaEnabled && !captcha) {
      setError("Lütfen robot olmadığınızı doğrulayın.");
      return;
    }
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/support/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || ""),
          subject: String(form.get("subject") || ""),
          body: String(form.get("body") || ""),
          category,
          recaptchaToken: recaptchaEnabled ? captcha : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; publicNumber?: string };
      if (!res.ok) {
        setError(data.error || "Talep gönderilemedi.");
        setCaptcha("");
        return;
      }
      setDone(data.publicNumber || "");
      e.currentTarget.reset();
      setCaptcha("");
    } catch {
      setError("Bağlantı hatası");
      setCaptcha("");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-md border border-line bg-white p-6">
        <p className="text-[16px] font-extrabold text-navy">Talebiniz alındı</p>
        <p className="mt-2 text-[14px] leading-relaxed text-[#555]">
          Talep numaranız <strong>#{done}</strong>. Mesai saatleri içinde dönüş yapılır. Üye girişi yaptıysanız talebi
          Hesabım &gt; Destek Taleplerim sayfasından takip edebilirsiniz.
        </p>
        <button type="button" onClick={() => setDone(null)} className="mt-4 h-10 rounded-md bg-navy px-4 text-[13px] font-extrabold text-white">
          Yeni talep aç
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="rounded-md border border-line bg-white p-6 sm:p-8">
      <h2 className="text-[18px] font-extrabold tracking-wide text-navy uppercase">Destek Talebi</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
        Sipariş, iade, kargo veya hesap sorularınızı buradan iletebilirsiniz.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="block text-[13px] font-semibold text-navy">
          Ad Soyad
          <input name="name" required defaultValue={defaultName} className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm" />
        </label>
        <label className="block text-[13px] font-semibold text-navy">
          E-posta
          <input name="email" type="email" required defaultValue={defaultEmail} className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm" />
        </label>
        <label className="block text-[13px] font-semibold text-navy">
          Telefon (isteğe bağlı)
          <input name="phone" type="tel" defaultValue={defaultPhone} placeholder="05xx xxx xx xx" className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm" />
        </label>
        <label className="block text-[13px] font-semibold text-navy">
          Kategori
          <select value={category} onChange={(e) => setCategory(e.target.value as SupportCategoryId)} className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm">
            {Object.entries(SUPPORT_CATEGORY_LABEL).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-3 block text-[13px] font-semibold text-navy">
        Konu
        <input name="subject" required minLength={4} className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm" />
      </label>
      <label className="mt-3 block text-[13px] font-semibold text-navy">
        Mesajınız
        <textarea name="body" required minLength={10} rows={5} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
      </label>
      {recaptchaEnabled && recaptchaSiteKey ? (
        <div className="mt-4">
          <RecaptchaField siteKey={recaptchaSiteKey} token={captcha} onToken={setCaptcha} />
        </div>
      ) : null}
      {error ? <p className="mt-3 text-[13px] font-semibold text-brand-red">{error}</p> : null}
      <button type="submit" disabled={pending} className="mt-5 h-11 rounded-md bg-navy px-5 text-[13px] font-extrabold tracking-wide text-white disabled:opacity-60">
        {pending ? "Gönderiliyor…" : "Talebi Gönder"}
      </button>
    </form>
  );
}
