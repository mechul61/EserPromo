import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { recordLoginEvent } from "@/lib/auth/login-events";
import { promoteIfListed } from "@/lib/auth/admin";
import { getOrCreateCart } from "@/lib/commerce/cart";
import { normalizeEmail } from "@/lib/security/crypto";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { recaptchaClientIp, assertRecaptcha } from "@/lib/security/recaptcha";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
  recaptchaToken: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  if (!rateLimit(clientKey(req, "login"), 8, 15 * 60 * 1000)) {
    return jsonError("Çok fazla deneme. Bir süre sonra tekrar deneyin.", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("E-posta veya şifre hatalı.");

  const human = await assertRecaptcha(body.data.recaptchaToken, recaptchaClientIp(req));
  if (!human) return jsonError("Robot doğrulaması başarısız. Tekrar deneyin.");

  const email = normalizeEmail(body.data.email);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || user.blocked) return jsonError("E-posta veya şifre hatalı.", 401);
  const match = await verifyPassword(body.data.password, user.passwordHash);
  if (!match) return jsonError("E-posta veya şifre hatalı.", 401);

  await createSession(user.id, body.data.rememberMe === true);
  await recordLoginEvent(user.id, email, req, "login");
  await getOrCreateCart();
  const promoted = await promoteIfListed(user.id, email);
  return Response.json({
    ok: true,
    role: promoted ? "super_admin" : user.role,
  });
}
