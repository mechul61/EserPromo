import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { sha256 } from "@/lib/security/crypto";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  token: z.string().min(16).max(128),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  if (!rateLimit(clientKey(req, "reset-password"), 8, 15 * 60 * 1000)) {
    return jsonError("Çok fazla deneme. Bir süre sonra tekrar deneyin.", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Bilgileri kontrol edin.");

  const policy = passwordPolicyError(body.data.password);
  if (policy) return jsonError(policy);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(body.data.token) },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return jsonError("Bağlantı geçersiz veya süresi dolmuş.", 400);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: await hashPassword(body.data.password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
    }),
    prisma.session.deleteMany({ where: { userId: row.userId } }),
  ]);

  return Response.json({ ok: true });
}
