import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { hashPassword, passwordPolicyError, verifyPassword } from "@/lib/auth/password";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  currentPassword: z.string().min(1).max(72),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const sessionUser = await getCurrentUser();
  if (!sessionUser) return jsonError("Giriş yapın.", 401);

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Bilgileri kontrol edin.");

  const policy = passwordPolicyError(body.data.password);
  if (policy) return jsonError(policy);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });
  const match = await verifyPassword(body.data.currentPassword, user.passwordHash);
  if (!match) return jsonError("Mevcut şifre hatalı.");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(body.data.password) },
  });

  return Response.json({ ok: true });
}
