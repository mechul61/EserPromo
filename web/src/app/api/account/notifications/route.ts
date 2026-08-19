import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  id: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return jsonError("Bilgileri kontrol edin.");

  const now = new Date();
  if (body.data.id) {
    await prisma.userNotification.updateMany({
      where: { id: body.data.id, userId: user.id, readAt: null },
      data: { readAt: now },
    });
  } else {
    await prisma.userNotification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: now },
    });
  }

  return Response.json({ ok: true });
}
