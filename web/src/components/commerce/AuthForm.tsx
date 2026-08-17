"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordRules } from "@/components/commerce/PasswordRules";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");

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
      const data = (await res.json()) as { error?: string; role?: string };
      if (!res.ok) {
        setError(data.error || "İşlem başarısız");
        return;
      }
      router.refresh();
      router.push(data.role === "admin" ? "/admin" : "/hesabim");
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
          minLength={mode === "register" ? 8 : 1}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm"
        />
      </label>
      {mode === "register" ? <PasswordRules value={password} /> : null}
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
