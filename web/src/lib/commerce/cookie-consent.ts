export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export const COOKIE_CONSENT_KEY = "ep_cookie_consent_v1";

export function defaultConsent(): CookieConsent {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
  };
}

export function acceptAllConsent(): CookieConsent {
  return {
    necessary: true,
    analytics: true,
    marketing: true,
    updatedAt: new Date().toISOString(),
  };
}

export function readStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    if (parsed.necessary !== true || typeof parsed.updatedAt !== "string") return null;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function writeStoredConsent(consent: CookieConsent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
}

export function hasStoredConsent() {
  return readStoredConsent() !== null;
}
