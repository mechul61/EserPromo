import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  if (id === admin.id && !body.data.isActive) {
    return jsonError("Kendi hesabınızı pasifleştiremezsiniz.");
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return jsonError("Kullanıcı bulunamadı", 404);

  await prisma.user.update({ where: { id }, data: { isActive: body.data.isActive } });
  return Response.json({ ok: true, isActive: body.data.isActive });
}
