"use client";

import { useState } from "react";
import { PasswordRules } from "@/components/commerce/PasswordRules";
import { HoldRevealPassword } from "@/components/commerce/HoldRevealPassword";
import { passwordPolicyError } from "@/lib/auth/password-policy";

const inputClass =
  "mt-1 block h-11 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-orange";

export function PasswordView() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
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
    setMessage(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Şifre güncellenemedi");
        return;
      }
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirm("");
      setMessage("Şifreniz güncellendi.");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="max-w-xl rounded-md border border-line bg-white p-5">
      <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Şifre Değiştir</h2>
      <div className="mt-4 space-y-3">
        <label className="block text-[12px] font-bold text-[#555]">
          Mevcut Şifre
          <HoldRevealPassword
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            className={inputClass}
          />
        </label>
        <label className="block text-[12px] font-bold text-[#555]">
          Yeni Şifre
          <HoldRevealPassword
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            className={inputClass}
          />
        </label>
        <label className="block text-[12px] font-bold text-[#555]">
          Yeni Şifre Tekrar
          <HoldRevealPassword
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            className={inputClass}
          />
        </label>
      </div>
      <PasswordRules value={password} />
      {error ? <p className="mt-3 text-[13px] text-brand-red">{error}</p> : null}
      {message ? <p className="mt-3 text-[13px] text-brand-green">{message}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={() => void save()}
        className="mt-5 h-11 rounded-md bg-orange px-6 text-[13px] font-extrabold tracking-wide text-[#111] hover:bg-orange-hover disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Şifreyi Güncelle"}
      </button>
    </section>
  );
}
