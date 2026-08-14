"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload =
      mode === "register"
        ? {
            name: String(form.get("name") || ""),
            email: String(form.get("email") || ""),
            password: String(form.get("password") || ""),
          }
        : {
            email: String(form.get("email") || ""),
            password: String(form.get("password") || ""),
          };

    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "İşlem başarısız");
        return;
      }
      router.refresh();
      router.push("/hesabim");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

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
      <label className="block text-[13px] font-semibold text-navy">
        Şifre
        <input
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 10 : 1}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm"
        />
      </label>
      {mode === "register" ? (
        <p className="text-[12px] text-muted">En az 10 karakter, harf ve rakam.</p>
      ) : null}
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
