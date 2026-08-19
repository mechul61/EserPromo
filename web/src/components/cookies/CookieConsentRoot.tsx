"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  acceptAllConsent,
  readStoredConsent,
  writeStoredConsent,
  type CookieConsent,
} from "@/lib/commerce/cookie-consent";
import { CookiePreferencesPanel } from "@/components/cookies/CookiePreferencesPanel";

async function fetchAccountConsent(): Promise<CookieConsent | null> {
  const res = await fetch("/api/account/cookie-preferences/", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as {
    analytics: boolean;
    marketing: boolean;
    consentAt: string | null;
  };
  if (!data.consentAt) return null;
  return {
    necessary: true,
    analytics: data.analytics,
    marketing: data.marketing,
    updatedAt: data.consentAt,
  };
}

async function persistConsent(consent: CookieConsent) {
  writeStoredConsent(consent);
  await fetch("/api/account/cookie-preferences/", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analytics: consent.analytics,
      marketing: consent.marketing,
    }),
  }).catch(() => null);
}

export function CookieConsentRoot() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const stored = readStoredConsent();
      if (stored) {
        if (!cancelled) {
          setVisible(false);
          setReady(true);
        }
        return;
      }

      const account = await fetchAccountConsent();
      if (cancelled) return;

      if (account) {
        writeStoredConsent(account);
        setVisible(false);
      } else {
        setDraft({ analytics: false, marketing: false });
        setVisible(true);
      }
      setReady(true);
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !visible || pathname.startsWith("/admin")) return null;

  async function acceptAll() {
    const consent = acceptAllConsent();
    await persistConsent(consent);
    setVisible(false);
    setSettingsOpen(false);
  }

  async function saveSettings(values: Pick<CookieConsent, "analytics" | "marketing">) {
    const consent: CookieConsent = {
      necessary: true,
      analytics: values.analytics,
      marketing: values.marketing,
      updatedAt: new Date().toISOString(),
    };
    await persistConsent(consent);
    setVisible(false);
    setSettingsOpen(false);
  }

  return (
    <>
      {!settingsOpen ? (
        <div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          className="fixed inset-x-0 bottom-0 z-[90] border-t border-line bg-white shadow-[0_-8px_32px_rgba(15,23,42,0.12)]"
        >
          <div className="container-ep flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-5">
            <div className="min-w-0 flex-1">
              <p id="cookie-consent-title" className="text-[13px] font-extrabold tracking-wide text-navy uppercase">
                Çerez Kullanımı
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#555]">
                Web sitemizde size daha iyi hizmet verebilmek için çerezler kullanılmaktadır.{" "}
                <strong className="font-semibold text-[#333]">Kabul Et</strong> ile tüm çerezleri kabul edebilir veya{" "}
                <strong className="font-semibold text-[#333]">Ayarlar</strong> ile tercihlerinizi yönetebilirsiniz.{" "}
                <Link href="/cerez-politikasi/" className="font-semibold text-navy underline underline-offset-2">
                  Çerez Politikası
                </Link>
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:w-[200px]">
              <button
                type="button"
                onClick={() => void acceptAll()}
                className="rounded-md bg-navy px-4 py-2.5 text-[13px] font-extrabold text-white hover:bg-[#0a2540]"
              >
                Kabul Et
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft({ analytics: false, marketing: false });
                  setSettingsOpen(true);
                }}
                className="rounded-md border border-line bg-white px-4 py-2.5 text-[13px] font-extrabold text-navy hover:bg-soft"
              >
                Ayarlar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {settingsOpen ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0f172a]/45 p-4 sm:items-center">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-line bg-white p-5 shadow-xl sm:p-6">
            <button
              type="button"
              aria-label="Kapat"
              onClick={() => setSettingsOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-[#8b919a] hover:bg-soft hover:text-navy"
            >
              <X className="size-5" />
            </button>
            <h2 className="pr-8 text-[18px] font-extrabold tracking-wide text-navy uppercase">Çerez Ayarları</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#555]">
              Hangi çerez kategorilerinin kullanılacağını seçin. Zorunlu çerezler devre dışı bırakılamaz.
            </p>
            <div className="mt-4">
              <CookiePreferencesPanel
                compact
                initial={draft}
                showActions
                onSave={async (values) => {
                  await saveSettings(values);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
