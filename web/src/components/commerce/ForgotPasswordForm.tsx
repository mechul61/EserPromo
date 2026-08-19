"use client";

import { useState } from "react";
import Link from "next/link";
import { RecaptchaField } from "@/components/commerce/RecaptchaField";
import { SITE_CONTACT } from "@/data/catalog-page";

export function ForgotPasswordForm({
  recaptchaEnabled = true,
  recaptchaSiteKey = "",
}: {
  recaptchaEnabled?: boolean;
  recaptchaSiteKey?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [captcha, setCaptcha] = useState("");

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
      const res = await fetch("/api/auth/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          recaptchaToken: recaptchaEnabled ? captcha : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; resetUrl?: string };
      if (!res.ok) {
        setError(data.error || "İşlem başarısız");
        setCaptcha("");
        return;
      }
      setResetUrl(data.resetUrl ?? null);
      setDone(true);
    } catch {
      setError("Bağlantı hatası");
      setCaptcha("");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-md space-y-3 rounded-xl border border-line bg-white p-6 text-[13px] shadow-sm">
        <p className="font-semibold text-navy">İstek alındı.</p>
        <p className="text-[#555]">
          Bu e-posta kayıtlıysa şifre yenileme bağlantısı gönderilir. Gelen kutusu ve spam klasörünü kontrol edin.
          E-posta gelmezse {SITE_CONTACT.email} veya WhatsApp hattımızdan yazabilirsiniz.
        </p>
        {resetUrl ? (
          <Link href={resetUrl} className="inline-flex h-11 items-center justify-center rounded-md bg-navy px-4 font-bold text-white hover:bg-navy-deep">
            Şifreyi yenile
          </Link>
        ) : (
          <a
            href={`${SITE_CONTACT.whatsappHref}?text=${encodeURIComponent(
              "Merhaba, şifremi unuttum. Kayıtlı e-postam ile yeni şifre istiyorum.",
            )}`}
            className="inline-flex h-11 items-center justify-center rounded-md bg-navy px-4 font-bold text-white hover:bg-navy-deep"
          >
            WhatsApp ile yaz
          </a>
        )}
        <p>
          <Link href="/giris" className="font-semibold text-navy">
            Girişe dön
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-3 rounded-xl border border-line bg-white p-6 shadow-sm">
      <label className="block text-[13px] font-semibold text-navy">
        E-posta
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm"
        />
      </label>
      {recaptchaEnabled && recaptchaSiteKey ? (
        <RecaptchaField siteKey={recaptchaSiteKey} token={captcha} onToken={setCaptcha} />
      ) : null}
      {error ? <p className="text-[13px] text-brand-red">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-navy text-[14px] font-bold text-white hover:bg-navy-deep disabled:opacity-60"
      >
        {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
      </button>
    </form>
  );
}
