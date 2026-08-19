"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HoldRevealPassword } from "@/components/commerce/HoldRevealPassword";
import { PasswordRules } from "@/components/commerce/PasswordRules";
import { RecaptchaField } from "@/components/commerce/RecaptchaField";
import { isStaffRole } from "@/lib/admin/staff-copy";

type Mode = "login" | "register";

export function AuthForm({ mode, recaptchaEnabled = true }: { mode: Mode; recaptchaEnabled?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [notifyOrder, setNotifyOrder] = useState(true);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (recaptchaEnabled && !captcha) {
      setError("Lütfen robot olmadığınızı doğrulayın.");
      return;
    }
    if (mode === "register" && !notifyEmail && !notifySms && !notifyWhatsapp && !notifyOrder) {
      setError("En az bir mesaj kanalı seçin.");
      return;
    }
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") || ""),
            email: String(form.get("email") || ""),
            password: String(form.get("password") || ""),
            phone: String(form.get("phone") || ""),
            recaptchaToken: recaptchaEnabled ? captcha : undefined,
            notifyEmail,
            notifySms,
            notifyWhatsapp,
            notifyOrder,
          }
        : {
            email: String(form.get("email") || ""),
            password: String(form.get("password") || ""),
            recaptchaToken: recaptchaEnabled ? captcha : undefined,
            rememberMe: form.get("rememberMe") === "on",
          };

    try {
      const res = await fetch(`/api/auth/${mode}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string; role?: string };
      if (!res.ok) {
        setError(data.error || "İşlem başarısız");
        setCaptcha("");
        return;
      }
      router.refresh();
      router.push(isStaffRole(data.role || "") ? "/admin" : "/hesabim");
    } catch {
      setError("Bağlantı hatası");
      setCaptcha("");
    } finally {
      setPending(false);
    }
  }

  const needPhone = notifySms || notifyWhatsapp;

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-3 rounded-xl border border-line bg-white p-6 shadow-sm">
      {mode === "register" ? (
        <label className="block text-[13px] font-semibold text-navy">
          Ad Soyad
          <input
            name="name"
            required
            autoComplete="name"
            className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm"
          />
        </label>
      ) : null}
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
      {mode === "register" ? (
        <label className="block text-[13px] font-semibold text-navy">
          Telefon {needPhone ? "" : "(isteğe bağlı)"}
          <input
            name="phone"
            type="tel"
            required={needPhone}
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
            className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm"
          />
        </label>
      ) : null}
      <label className="block text-[13px] font-semibold text-navy">
        Şifre
        <HoldRevealPassword
          name="password"
          required
          minLength={mode === "register" ? 8 : 1}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={password}
          onChange={setPassword}
          className="h-11 w-full rounded-md border border-line px-3 text-sm"
        />
      </label>
      {mode === "register" ? <PasswordRules value={password} /> : null}
      {mode === "register" ? (
        <fieldset className="rounded-md border border-line bg-soft/60 p-3">
          <legend className="px-1 text-[13px] font-extrabold text-navy">Hangi yollardan mesaj gönderelim?</legend>
          <p className="mb-2 text-[12px] text-[#6b7280]">
            Favori ürünleriniz indirime girince ve sipariş güncellemelerinde bu kanalları kullanırız.
          </p>
          <div className="space-y-2 text-[13px] font-semibold text-navy">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="size-4 rounded border-line accent-navy"
              />
              E-posta
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                className="size-4 rounded border-line accent-navy"
              />
              SMS
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyWhatsapp}
                onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                className="size-4 rounded border-line accent-navy"
              />
              WhatsApp
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifyOrder}
                onChange={(e) => setNotifyOrder(e.target.checked)}
                className="size-4 rounded border-line accent-navy"
              />
              Sipariş ve kargo bildirimleri
            </label>
          </div>
        </fieldset>
      ) : null}
      {mode === "login" ? (
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[13px] font-semibold text-navy">
            <input
              type="checkbox"
              name="rememberMe"
              className="size-4 rounded border-line accent-navy"
            />
            Beni hatırla
          </label>
          <Link href="/sifremi-unuttum" className="text-[13px] font-semibold text-navy hover:text-orange">
            Şifremi unuttum
          </Link>
        </div>
      ) : null}
      {recaptchaEnabled ? <RecaptchaField token={captcha} onToken={setCaptcha} /> : null}
      {error ? <p className="text-[13px] text-brand-red">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-navy text-[14px] font-bold text-white hover:bg-navy-deep disabled:opacity-60"
      >
        {pending ? "Gönderiliyor…" : mode === "register" ? "Üye Ol" : "Giriş Yap"}
      </button>
    </form>
  );
}
