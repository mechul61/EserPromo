/** Google'ın dokümantasyon test anahtarları — canlıda kullanılmamalı. */
export const RECAPTCHA_TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
export const RECAPTCHA_TEST_SECRET_KEY = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNLuza6CkdAhg6";

export function recaptchaSiteKeyFromEnv() {
  return (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "").trim();
}

export function recaptchaSecretKeyFromEnv() {
  return (process.env.RECAPTCHA_SECRET_KEY || "").trim();
}

export function isRecaptchaTestKey(siteKey = recaptchaSiteKeyFromEnv()) {
  return !siteKey || siteKey === RECAPTCHA_TEST_SITE_KEY;
}

export function isRecaptchaConfigured() {
  const siteKey = recaptchaSiteKeyFromEnv();
  const secretKey = recaptchaSecretKeyFromEnv();
  if (!siteKey || !secretKey) return false;
  if (siteKey === RECAPTCHA_TEST_SITE_KEY || secretKey === RECAPTCHA_TEST_SECRET_KEY) {
    return process.env.NODE_ENV !== "production";
  }
  return true;
}

/** İstemciye verilecek site key (sunucu env'den okunur, build gerektirmez). */
export function recaptchaSiteKeyForClient() {
  return isRecaptchaConfigured() ? recaptchaSiteKeyFromEnv() : "";
}
