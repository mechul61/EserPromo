import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizeEmail, randomToken, sha256 } from "@/lib/security/crypto";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { recaptchaClientIp, assertRecaptcha } from "@/lib/security/recaptcha";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { sendPasswordResetEmail } from "@/lib/mail";

const schema = z.object({
  email: z.string().email(),
  recaptchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  if (!rateLimit(clientKey(req, "forgot-password"), 5, 15 * 60 * 1000)) {
    return jsonError("Çok fazla deneme. Bir süre sonra tekrar deneyin.", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("E-posta adresini kontrol edin.");

  const human = await assertRecaptcha(body.data.recaptchaToken, recaptchaClientIp(req));
  if (!human) return jsonError("Robot doğrulaması başarısız. Tekrar deneyin.");

  const email = normalizeEmail(body.data.email);
  const user = await prisma.user.findUnique({ where: { email } });
  const payload: { ok: true; resetUrl?: string } = { ok: true };

  if (user?.isActive) {
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    const token = randomToken(32);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    const mail = await sendPasswordResetEmail(email, token);
    if (!mail.sent && process.env.NODE_ENV !== "production") {
      payload.resetUrl = mail.resetUrl;
    }
  }

  return Response.json(payload);
}
