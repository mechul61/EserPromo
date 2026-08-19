"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecaptchaSetting({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(enabled);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: boolean) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/security/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recaptchaEnabled: next }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi");
        return;
      }
      setValue(next);
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="max-w-xl rounded-md border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-extrabold tracking-wide text-navy uppercase">reCAPTCHA</h2>
          <p className="mt-1 text-[13px] text-[#6b7280]">
            Açıkken giriş ve üyelik formunda robot doğrulaması istenir. Kapalıyken kutu görünmez.
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => void save(!value)}
          className={`rounded-md px-3 py-2 text-[12px] font-extrabold tracking-wide disabled:opacity-50 ${
            value ? "bg-[#e8f7ee] text-[#1f9d55]" : "bg-[#fdecec] text-brand-red"
          }`}
        >
          {pending ? "Kaydediliyor…" : value ? "Açık" : "Kapalı"}
        </button>
      </div>
      {error ? <p className="mt-3 text-[13px] text-brand-red">{error}</p> : null}
    </section>
  );
}
