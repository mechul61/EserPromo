"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { RecaptchaField } from "@/components/commerce/RecaptchaField";
import { SUPPORT_CATEGORY_LABEL, type SupportCategoryId } from "@/lib/commerce/support-copy";

export function ContactForm({
  recaptchaEnabled = true,
  defaultName = "",
  defaultEmail = "",
  defaultPhone = "",
}: {
  recaptchaEnabled?: boolean;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState("");
  const [category, setCategory] = useState<SupportCategoryId>("other");
  const [kvkk, setKvkk] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!kvkk) {
      setError("KVKK aydınlatma metnini kabul etmeniz gerekiyor.");
      return;
    }
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
          subject: String(form.get("subject") || "İletişim formu"),
          body: String(form.get("body") || ""),
          category,
          recaptchaToken: recaptchaEnabled ? captcha : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; publicNumber?: string };
      if (!res.ok) {
        setError(data.error || "Gönderilemedi.");
        setCaptcha("");
        return;
      }
      setDone(data.publicNumber || "OK");
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
      <div className="mt-4 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] p-5 text-center">
        <CheckCircle2 className="mx-auto size-8 text-[#16a34a]" />
        <p className="mt-2 text-[15px] font-extrabold text-[#166534]">Mesajınız alındı!</p>
        <p className="mt-1 text-[12px] text-[#4b5563]">
          Talep numaranız <strong>#{done}</strong>. Mesai saatleri içinde dönüş yapılacaktır.
        </p>
        <button
          type="button"
          onClick={() => setDone(null)}
          className="mt-4 h-9 rounded-lg bg-navy px-4 text-[12px] font-bold text-white"
        >
          Yeni mesaj gönder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] font-bold text-[#334155]">
            Ad Soyad <span className="text-[#dc2626]">*</span>
          </span>
          <input
            name="name"
            required
            defaultValue={defaultName}
            placeholder="Adınız soyadınız"
            className="mt-1 h-10 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none placeholder:text-[#94a3b8] focus:border-navy"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-bold text-[#334155]">
            E-posta <span className="text-[#dc2626]">*</span>
          </span>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaultEmail}
            placeholder="E-posta adresiniz"
            className="mt-1 h-10 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none placeholder:text-[#94a3b8] focus:border-navy"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-bold text-[#334155]">Telefon</span>
          <input
            name="phone"
            type="tel"
            defaultValue={defaultPhone}
            placeholder="05xx xxx xx xx"
            className="mt-1 h-10 w-full rounded-lg border border-[#dbe3ee] px-3 text-[13px] outline-none placeholder:text-[#94a3b8] focus:border-navy"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-bold text-[#334155]">
            Konu <span className="text-[#dc2626]">*</span>
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SupportCategoryId)}
            className="mt-1 h-10 w-full appearance-none rounded-lg border border-[#dbe3ee] bg-white px-3 text-[13px] text-[#64748b] outline-none focus:border-navy"
          >
            <option value="" disabled>
              Konu seçiniz
            </option>
            {Object.entries(SUPPORT_CATEGORY_LABEL).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-[12px] font-bold text-[#334155]">
          Mesajınız <span className="text-[#dc2626]">*</span>
        </span>
        <textarea
          name="body"
          required
          minLength={10}
          rows={4}
          placeholder="Mesajınızı buraya yazabilirsiniz…"
          className="mt-1 w-full rounded-lg border border-[#dbe3ee] px-3 py-2.5 text-[13px] outline-none placeholder:text-[#94a3b8] focus:border-navy"
        />
      </label>

      {recaptchaEnabled ? (
        <div className="mt-3">
          <RecaptchaField token={captcha} onToken={setCaptcha} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-start gap-2 text-[12px] text-[#6b7280]">
          <input
            type="checkbox"
            checked={kvkk}
            onChange={(e) => setKvkk(e.target.checked)}
            className="mt-0.5 size-4 rounded border-[#dbe3ee]"
          />
          <span>
            KVKK{" "}
            <a href="/kvkk" target="_blank" className="font-semibold text-[#2563eb] underline">
              aydınlatma metnini
            </a>{" "}
            okudum, kabul ediyorum.
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2563eb] px-5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          <Send className="size-4" />
          {pending ? "Gönderiliyor…" : "Gönder"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-[12px] font-semibold text-[#dc2626]">{error}</p>
      ) : null}
    </form>
  );
}
