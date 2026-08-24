"use client";

import { useEffect, useRef, useState } from "react";

export function IyzicoCheckout({ orderNumber }: { orderNumber: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/payments/iyzico/start/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber }),
        });
        const data = (await res.json()) as {
          error?: string;
          paymentPageUrl?: string;
          checkoutFormContent?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Ödeme formu yüklenemedi");
          setLoading(false);
          return;
        }

        if (data.paymentPageUrl) {
          window.location.href = data.paymentPageUrl;
          return;
        }

        if (data.checkoutFormContent && hostRef.current) {
          hostRef.current.innerHTML = data.checkoutFormContent;
          hostRef.current.querySelectorAll("script").forEach((oldScript) => {
            const script = document.createElement("script");
            for (const attr of oldScript.attributes) {
              script.setAttribute(attr.name, attr.value);
            }
            script.text = oldScript.textContent || "";
            oldScript.replaceWith(script);
          });
          setLoading(false);
          return;
        }

        setError("Iyzico ödeme formu alınamadı");
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Bağlantı hatası");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <div className="rounded-md border border-line bg-white p-5">
      <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Kart ile Öde</h2>
      <p className="mt-2 text-[13px] text-[#6b7280]">
        Kart bilgileriniz Iyzico güvenli ödeme sayfasında işlenir; sitemizde saklanmaz.
      </p>
      {loading ? <p className="mt-4 text-[13px] text-[#6b7280]">Ödeme formu yükleniyor…</p> : null}
      {error ? <p className="mt-4 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}
      <div ref={hostRef} className="mt-4 min-h-[280px]" />
    </div>
  );
}
