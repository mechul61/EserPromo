import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { recordLoginEvent } from "@/lib/auth/login-events";
import { promoteIfListed } from "@/lib/auth/admin";
import { getOrCreateCart } from "@/lib/commerce/cart";
import { normalizeEmail } from "@/lib/security/crypto";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { recaptchaClientIp, assertRecaptcha } from "@/lib/security/recaptcha";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { isValidTRPhone, phoneDigits } from "@/lib/phone";
import { splitName } from "@/lib/account";
import { notifyWelcome, safeNotify } from "@/lib/commerce/email-templates";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  recaptchaToken: z.string().optional(),
  phone: z.string().trim().max(32).optional(),
  city: z.string().trim().max(40).optional(),
  district: z.string().trim().max(40).optional(),
  line: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().max(10).optional(),
  notifyEmail: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notifyWhatsapp: z.boolean().optional(),
  notifyOrder: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  if (!rateLimit(clientKey(req, "register"), 5, 15 * 60 * 1000)) {
    return jsonError("Çok fazla deneme. Bir süre sonra tekrar deneyin.", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Bilgileri kontrol edin.");

  const human = await assertRecaptcha(body.data.recaptchaToken, recaptchaClientIp(req));
  if (!human) return jsonError("Robot doğrulaması başarısız. Tekrar deneyin.");

  const policy = passwordPolicyError(body.data.password);
  if (policy) return jsonError(policy);

  const notifyEmail = body.data.notifyEmail ?? true;
  const notifySms = body.data.notifySms ?? false;
  const notifyWhatsapp = body.data.notifyWhatsapp ?? false;
  const notifyOrder = body.data.notifyOrder ?? true;
  if (!notifyEmail && !notifySms && !notifyWhatsapp && !notifyOrder) {
    return jsonError("En az bir mesaj kanalı seçin.");
  }

  const phoneRaw = body.data.phone?.trim() || "";
  if ((notifySms || notifyWhatsapp) && !isValidTRPhone(phoneRaw)) {
    return jsonError("SMS veya WhatsApp için geçerli bir telefon numarası girin.");
  }
  const phone = phoneRaw ? phoneDigits(phoneRaw) : null;

  const email = normalizeEmail(body.data.email);
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return jsonError("Bu e-posta ile kayıt oluşturulamadı.");

  const names = splitName(body.data.name.trim());

  const user = await prisma.user.create({
    data: {
      email,
      name: body.data.name.trim(),
      passwordHash: await hashPassword(body.data.password),
      phone,
      profile: {
        create: {
          firstName: names.firstName,
          lastName: names.lastName,
          notifyEmail,
          notifySms,
          notifyWhatsapp,
          notifyOrder,
        },
      },
      addresses:
        body.data.city && body.data.district && body.data.line
          ? {
              create: {
                title: "Teslimat",
                fullName: body.data.name.trim(),
                email,
                phone: phone || "-",
                country: "Türkiye",
                city: body.data.city.trim(),
                district: body.data.district.trim(),
                postalCode: body.data.postalCode?.trim() || "",
                line: body.data.line.trim(),
                isDefault: true,
              },
            }
          : undefined,
    },
  });

  await createSession(user.id);
  await recordLoginEvent(user.id, email, req, "register");
  await getOrCreateCart();
  const promoted = await promoteIfListed(user.id, email);
  await safeNotify(notifyWelcome(email, user.name));
  return Response.json({ ok: true, role: promoted ? "super_admin" : "customer" });
}
