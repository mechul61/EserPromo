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

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError("Geçersiz kategori");

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!category) return jsonError("Kategori bulunamadı", 404);

  await prisma.category.update({
    where: { id },
    data: { showOnHomepage: body.data.isActive },
  });
  return Response.json({ ok: true, showOnHomepage: body.data.isActive });
}
