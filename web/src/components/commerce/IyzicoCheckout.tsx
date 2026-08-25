"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { IYZICO_POPUP_NAME, iyzicoPopupFeatures } from "@/lib/payments/iyzico-popup";

type IyzicoMessage = {
  source?: string;
  ok?: boolean;
  orderNumber?: string;
  paymentStatus?: string;
  message?: string;
};

const PENDING_KEY = "iyzico_popup_pending";

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

function tryOpenPopup() {
  try {
    const popup = window.open("", IYZICO_POPUP_NAME, iyzicoPopupFeatures());
    if (!popup) return null;
    // Cross-origin sonrası .closed güvenilmez; sadece null/engeli kontrol et.
    return popup;
  } catch {
    return null;
  }
}

export function IyzicoCheckout({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const popupRef = useRef<Window | null>(null);
  const settledRef = useRef(false);
  const aliveRef = useRef(true);
  const pollTimerRef = useRef<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [needsClick, setNeedsClick] = useState(false);
  const [phase, setPhase] = useState("Ödeme hazırlanıyor…");

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    pollTimerRef.current = undefined;
  }, []);

  const finish = useCallback(
    (input: { ok: boolean; message?: string; orderNumber?: string }) => {
      if (settledRef.current || !aliveRef.current) return;
      settledRef.current = true;
      clearPoll();
      setWaiting(false);
      setNeedsClick(false);
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
      setNeedsClick(true);
    },
    [clearPoll, orderNumber, router],
  );

  const startPayment = useCallback(
    async (popup: Window) => {
      clearPoll();
      settledRef.current = false;
      setError(null);
      setNeedsClick(false);
      setWaiting(true);
      setPhase("Iyzico güvenli ödeme hazırlanıyor…");
      popupRef.current = popup;

      const pollStatus = async () => {
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
      };

      try {
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

        if (!aliveRef.current) return;

        if (!res.ok) {
          setWaiting(false);
          setNeedsClick(true);
          setError(data.error || "Ödeme formu yüklenemedi");
          return;
        }

        try {
          if (data.paymentPageUrl) {
            popup.location.replace(data.paymentPageUrl);
          } else if (data.checkoutFormContent) {
            writeCheckoutHtml(popup, data.checkoutFormContent);
          } else {
            setWaiting(false);
            setNeedsClick(true);
            setError("Iyzico ödeme formu alınamadı");
            return;
          }
        } catch {
          // Cross-origin / kapalı referans: yine de durum yoklamaya devam et; popup zaten açık olabilir.
        }

        setPhase("Ödeme penceresinde işlemi tamamlayın…");

        // Kapanma algısı YOK — iyzico cross-origin iken window.closed yanlış pozitif veriyor.
        // Sonuç yalnızca callback postMessage veya ödeme status API'sinden gelir.
        pollTimerRef.current = window.setInterval(() => {
          void pollStatus();
        }, 2000);
        void pollStatus();
      } catch {
        if (aliveRef.current) {
          setWaiting(false);
          setNeedsClick(true);
          setError("Bağlantı hatası");
        }
      }
    },
    [clearPoll, finish, orderNumber],
  );

  useEffect(() => {
    aliveRef.current = true;

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

    let pending = "";
    try {
      pending = sessionStorage.getItem(PENDING_KEY) || "";
      if (pending === orderNumber) sessionStorage.removeItem(PENDING_KEY);
    } catch {
      pending = "";
    }

    if (pending === orderNumber) {
      const existing = tryOpenPopup();
      if (existing) {
        void startPayment(existing);
      } else {
        setNeedsClick(true);
        setWaiting(false);
        setPhase("Ödeme penceresini açın");
      }
    } else {
      setNeedsClick(true);
      setWaiting(false);
      setPhase("Ödeme penceresini açın");
    }

    return () => {
      aliveRef.current = false;
      window.removeEventListener("message", onMessage);
      clearPoll();
    };
  }, [clearPoll, finish, orderNumber, startPayment]);

  function openByClick() {
    const popup = tryOpenPopup();
    if (!popup) {
      setError("Tarayıcı ödeme penceresini engelledi. Lütfen popup iznine izin verin.");
      setNeedsClick(true);
      setWaiting(false);
      return;
    }
    void startPayment(popup);
  }

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-md border border-line bg-white p-5">
      <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Kart ile Öde</h2>
      <p className="mt-2 text-[13px] text-[#6b7280]">
        Kart bilgileriniz Iyzico güvenli ödeme penceresinde işlenir; sitemizde saklanmaz.
      </p>

      {error ? <p className="mt-4 text-[13px] font-semibold text-[#dc2626]">{error}</p> : null}

      {needsClick && !waiting ? (
        <div className="mt-4 space-y-3">
          <p className="text-[13px] text-[#6b7280]">
            Güvenli ödeme ayrı bir pencerede açılır. Devam etmek için butona tıklayın.
          </p>
          <button
            type="button"
            onClick={openByClick}
            className="h-11 rounded-md bg-navy px-4 text-[13px] font-extrabold tracking-wide text-white hover:bg-navy-deep"
            style={{ color: "#ffffff" }}
          >
            Ödeme penceresini aç
          </button>
        </div>
      ) : null}

      {!needsClick && !waiting && !error ? <p className="mt-4 text-[13px] text-[#6b7280]">{phase}</p> : null}

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
