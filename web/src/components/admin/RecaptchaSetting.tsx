"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RecaptchaSetting({
  enabled,
  configured,
}: {
  enabled: boolean;
  configured: boolean;
}) {
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
      {!configured ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          <p className="font-semibold">reCAPTCHA anahtarları yapılandırılmamış</p>
          <p className="mt-1 leading-relaxed text-amber-800">
            Sunucu <code className="text-[12px]">.env</code> dosyasında Google test anahtarları
            kullanılıyor veya anahtarlar eksik. Canlı sitede kırmızı test uyarısı görünmemesi için{" "}
            <a
              href="https://www.google.com/recaptcha/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              Google reCAPTCHA v2 (checkbox)
            </a>{" "}
            üzerinden <strong>eserpromo.com</strong> ve <strong>www.eserpromo.com</strong> için
            anahtar oluşturup{" "}
            <code className="text-[12px]">NEXT_PUBLIC_RECAPTCHA_SITE_KEY</code> ve{" "}
            <code className="text-[12px]">RECAPTCHA_SECRET_KEY</code> değerlerini güncelleyin; ardından
            uygulamayı yeniden başlatın.
          </p>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-extrabold tracking-wide text-navy uppercase">reCAPTCHA</h2>
          <p className="mt-1 text-[13px] text-[#6b7280]">
            Açıkken giriş, üyelik ve iletişim formlarında robot doğrulaması istenir. Kapalıyken kutu
            görünmez.
          </p>
        </div>
        <button
          type="button"
          disabled={pending || !configured}
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
