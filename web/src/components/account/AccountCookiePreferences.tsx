"use client";

import { writeStoredConsent, type CookieConsent } from "@/lib/commerce/cookie-consent";
import { CookiePreferencesPanel } from "@/components/cookies/CookiePreferencesPanel";

export function AccountCookiePreferences({
  initial,
}: {
  initial: Pick<CookieConsent, "analytics" | "marketing">;
}) {
  async function save(values: Pick<CookieConsent, "analytics" | "marketing">) {
    const res = await fetch("/api/account/cookie-preferences/", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("save failed");

    writeStoredConsent({
      necessary: true,
      analytics: values.analytics,
      marketing: values.marketing,
      updatedAt: new Date().toISOString(),
    });
  }

  return <CookiePreferencesPanel initial={initial} onSave={save} showActions />;
}
