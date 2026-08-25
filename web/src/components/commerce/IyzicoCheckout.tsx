"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type IyzicoMessage = {
  source?: string;
  ok?: boolean;
  orderNumber?: string;
  paymentStatus?: string;
  message?: string;
};

const POPUP_NAME = "eserpromo_iyzico_pay";
const POPUP_FEATURES =
  "width=520,height=760,menubar=no,toolbar=no,location=yes,status=yes,resizable=yes,scrollbars=yes";

function writeCheckoutHtml(popup: Window, html: string) {
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.document.querySelectorAll("script").forEach((oldScript) => {
    const script = popup.document.createElement("script");
    for (const attr of oldScript.attributes) {
      script.setAttribute(attr.name, attr.value);
    }
    script.text = oldScript.textContent || "";
    oldScript.replaceWith(script);
  });
}

export function IyzicoCheckout({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const popupRef = useRef<Window | null>(null);
  const settledRef = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(true);
  const [phase, setPhase] = useState("Ödeme penceresi açılıyor…");

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | undefined;
    let closeTimer: number | undefined;
    settledRef.current = false;
    setError(null);
    setWaiting(true);
    setPhase("Ödeme penceresi açılıyor…");

    function finish(input: { ok: boolean; message?: string; orderNumber?: string }) {
      if (settledRef.current || cancelled) return;
      settledRef.current = true;
      setWaiting(false);
      if (pollTimer) window.clearInterval(pollTimer);
      if (closeTimer) window.clearInterval(closeTimer);
      try {
        popupRef.current?.close();
      } catch {
        /* ignore */
      }
      popupRef.current = null;

      if (input.ok) {
        const no = input.orderNumber || orderNumber;
        router.replace(`/siparislerim/${no}/?odeme=basarili`);
        router.refresh();
        return;
      }

      setError(input.message || "Ödeme tamamlanamadı");
      setPhase("Ödeme sonucu alındı");
    }

    async function pollStatus() {
      try {
        const res = await fetch(`/api/payments/iyzico/status/?orderNumber=${encodeURIComponent(orderNumber)}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = (await res.json()) as {
          paymentStatus?: string;
          message?: string;
          orderNumber?: string;
        };
        if (!res.ok) return;
        if (data.paymentStatus === "success") {
          finish({ ok: true, orderNumber: data.orderNumber || orderNumber });
          return;
        }
        if (data.paymentStatus === "failure") {
          finish({
            ok: false,
            message: data.message || "Ödeme tamamlanamadı",
            orderNumber: data.orderNumber,
          });
        }
      } catch {
        /* retry */
      }
    }

    function onMessage(event: MessageEvent<IyzicoMessage>) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.source !== "eserpromo-iyzico") return;
      if (data.orderNumber && data.orderNumber !== orderNumber && data.orderNumber !== "") return;
      finish({
        ok: Boolean(data.ok),
        message: data.message,
        orderNumber: data.orderNumber || orderNumber,
      });
    }

    window.addEventListener("message", onMessage);

    void (async () => {
      try {
        const popup = window.open("about:blank", POPUP_NAME, POPUP_FEATURES);
        popupRef.current = popup;
        if (!popup) {
          setError("Tarayıcı ödeme penceresini engelledi. Lütfen popup izni verip tekrar deneyin.");
          setWaiting(false);
          return;
        }
        popup.document.write(
          "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Ödeme</title></head><body style='font-family:system-ui;padding:24px;text-align:center;color:#555'>Iyzico ödeme sayfası yükleniyor…</body></html>",
        );
        popup.document.close();

        setPhase("Iyzico güvenli ödeme hazırlanıyor…");
        const res = await fetch("/api/payments/iyzico/start/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ orderNumber }),
        });
        const data = (await res.json()) as {
          error?: string;
          paymentPageUrl?: string;
          checkoutFormContent?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          try {
            popup.close();
          } catch {
            /* ignore */
          }
          setError(data.error || "Ödeme formu yüklenemedi");
          setWaiting(false);
          return;
        }

        if (data.paymentPageUrl) {
          popup.location.href = data.paymentPageUrl;
        } else if (data.checkoutFormContent) {
          writeCheckoutHtml(popup, data.checkoutFormContent);
        } else {
          try {
            popup.close();
          } catch {
            /* ignore */
          }
          setError("Iyzico ödeme formu alınamadı");
          setWaiting(false);
          return;
        }

        setPhase("Ödeme penceresinde işlemi tamamlayın…");
        pollTimer = window.setInterval(() => {
          void pollStatus();
        }, 2500);

        closeTimer = window.setInterval(() => {
          const win = popupRef.current;
          if (!win || !win.closed) return;
          if (closeTimer) window.clearInterval(closeTimer);
          closeTimer = undefined;
          void (async () => {
            for (let i = 0; i < 6 && !settledRef.current && !cancelled; i++) {
              await pollStatus();
              if (settledRef.current) return;
              await new Promise((resolve) => window.setTimeout(resolve, 700));
            }
            if (!settledRef.current) {
              finish({
                ok: false,
                message: "Ödeme penceresi kapatıldı. Ödeme tamamlanmadıysa tekrar deneyebilirsiniz.",
              });
            }
          })();
        }, 800);
      } catch {
        if (!cancelled) {
          setError("Bağlantı hatası");
          setWaiting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("message", onMessage);
      if (pollTimer) window.clearInterval(pollTimer);
      if (closeTimer) window.clearInterval(closeTimer);
    };
  }, [orderNumber, router, attempt]);

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-md border border-line bg-white p-5">
      <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Kart ile Öde</h2>
      <p className="mt-2 text-[13px] text-[#6b7280]">
        Kart bilgileriniz Iyzico güvenli ödeme penceresinde işlenir; sitemizde saklanmaz.
      </p>

      {error ? (
        <div className="mt-4 space-y-3">
          <p className="text-[13px] font-semibold text-[#dc2626]">{error}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="h-11 rounded-md bg-navy px-4 text-[13px] font-extrabold tracking-wide text-white hover:bg-navy-deep"
            style={{ color: "#ffffff" }}
          >
            Tekrar dene
          </button>
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-[#6b7280]">{phase}</p>
      )}

      {waiting ? (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/92 backdrop-blur-[1px]"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="size-10 animate-spin text-navy" />
          <p className="px-6 text-center text-[14px] font-semibold text-navy">{phase}</p>
          <p className="px-6 text-center text-[12px] text-[#6b7280]">Sonuç dönene kadar bu sayfayı kapatmayın.</p>
        </div>
      ) : null}
    </div>
  );
}
