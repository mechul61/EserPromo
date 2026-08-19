"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HoldRevealPassword } from "@/components/commerce/HoldRevealPassword";
import { PasswordRules } from "@/components/commerce/PasswordRules";
import { passwordPolicyError } from "@/lib/auth/password-policy";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const policy = passwordPolicyError(password);
    if (policy) {
      setError(policy);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Şifre yenilenemedi");
        return;
      }
      router.push("/giris");
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-3 rounded-xl border border-line bg-white p-6 shadow-sm">
      <label className="block text-[13px] font-semibold text-navy">
        Yeni şifre
        <HoldRevealPassword
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm"
        />
      </label>
      <label className="block text-[13px] font-semibold text-navy">
        Yeni şifre tekrar
        <HoldRevealPassword
          required
          minLength={8}
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm"
        />
      </label>
      <PasswordRules value={password} />
      {error ? <p className="text-[13px] text-brand-red">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-navy text-[14px] font-bold text-white hover:bg-navy-deep disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Şifreyi güncelle"}
      </button>
      <p className="text-center text-[13px]">
        <Link href="/giris" className="font-semibold text-navy">
          Girişe dön
        </Link>
      </p>
    </form>
  );
}
