import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(200).optional(),
  schedule: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  isShared: z.boolean().optional(),
  kind: z.enum(["table", "chart"]).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Rapor bilgilerini kontrol edin");

  const existing = await prisma.savedReport.findUnique({ where: { id } });
  if (!existing) return jsonError("Rapor bulunamadı", 404);

  await prisma.savedReport.update({
    where: { id },
    data: {
      ...(body.data.name ? { name: body.data.name } : {}),
      ...(body.data.description !== undefined ? { description: body.data.description } : {}),
      ...(body.data.schedule ? { schedule: body.data.schedule } : {}),
      ...(body.data.isShared !== undefined ? { isShared: body.data.isShared } : {}),
      ...(body.data.kind ? { kind: body.data.kind } : {}),
    },
  });
  revalidatePath("/admin/raporlar");
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const existing = await prisma.savedReport.findUnique({ where: { id } });
  if (!existing) return jsonError("Rapor bulunamadı", 404);
  if (existing.isSystem) return jsonError("Sistem raporları silinemez");

  await prisma.savedReport.delete({ where: { id } });
  revalidatePath("/admin/raporlar");
  return Response.json({ ok: true });
}
