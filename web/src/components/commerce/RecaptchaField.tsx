"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type Grecaptcha = {
  ready?: (cb: () => void) => void;
  render?: (
    container: HTMLElement,
    parameters: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => number;
  reset?: (widgetId: number) => void;
};

function recaptchaApi(): Grecaptcha | undefined {
  return (window as Window & { grecaptcha?: Grecaptcha }).grecaptcha;
}

export function RecaptchaField({
  siteKey,
  token,
  onToken,
}: {
  siteKey: string;
  token: string;
  onToken: (token: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    function paint() {
      if (cancelled || widgetId.current !== null || !hostRef.current) return;
      const api = recaptchaApi();
      if (typeof api?.render !== "function") return;
      widgetId.current = api.render(hostRef.current, {
        sitekey: siteKey,
        callback: (value) => onTokenRef.current(value),
        "expired-callback": () => onTokenRef.current(""),
        "error-callback": () => onTokenRef.current(""),
      });
    }

    function mount() {
      const api = recaptchaApi();
      if (!api) return false;
      if (typeof api.ready === "function") {
        api.ready(paint);
        return true;
      }
      if (typeof api.render === "function") {
        paint();
        return true;
      }
      return false;
    }

    let timer: number | undefined;
    if (!mount()) {
      timer = window.setInterval(() => {
        if (mount()) window.clearInterval(timer);
      }, 150);
    }

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      const api = recaptchaApi();
      if (widgetId.current !== null && typeof api?.reset === "function") {
        try {
          api.reset(widgetId.current);
        } catch {
          /* widget already gone */
        }
      }
      widgetId.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (token) return;
    const api = recaptchaApi();
    if (widgetId.current === null || typeof api?.reset !== "function") return;
    try {
      api.reset(widgetId.current);
    } catch {
      /* ignore */
    }
  }, [token]);

  if (!siteKey) {
    return <p className="text-[12px] text-brand-red">reCAPTCHA anahtarı eksik.</p>;
  }

  return (
    <div>
      <Script src="https://www.google.com/recaptcha/api.js?render=explicit&hl=tr" strategy="afterInteractive" />
      <div ref={hostRef} />
    </div>
  );
}
