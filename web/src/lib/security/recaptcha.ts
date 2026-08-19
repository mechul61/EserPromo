import { prisma } from "@/lib/db";
import { isRecaptchaConfigured, recaptchaSecretKeyFromEnv } from "@/lib/security/recaptcha-config";

export { isRecaptchaConfigured, recaptchaSiteKeyForClient } from "@/lib/security/recaptcha-config";

export async function isRecaptchaEnabled() {
  if (!isRecaptchaConfigured()) return false;
  const row = await prisma.siteSetting.findUnique({
    where: { key: "recaptchaEnabled" },
    select: { value: true },
  });
  return row?.value !== "false";
}

export async function setRecaptchaEnabled(enabled: boolean) {
  await prisma.siteSetting.upsert({
    where: { key: "recaptchaEnabled" },
    create: { key: "recaptchaEnabled", value: enabled ? "true" : "false" },
    update: { value: enabled ? "true" : "false" },
  });
}

export async function verifyRecaptcha(token: string, ip?: string | null) {
  const secret = recaptchaSecretKeyFromEnv();
  if (!isRecaptchaConfigured() || !secret || !token.trim()) return false;

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export function recaptchaClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

export async function assertRecaptcha(token: string | undefined, ip?: string | null) {
  if (!(await isRecaptchaEnabled())) return true;
  if (!token) return false;
  return verifyRecaptcha(token, ip);
}
