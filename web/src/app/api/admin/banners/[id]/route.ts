import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { bannerPatchSchema, parseOptionalDate } from "@/lib/admin/banner-input";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

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
  const body = bannerPatchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const existing = await prisma.banner.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return jsonError("Banner bulunamadı", 404);

  await prisma.banner.update({
    where: { id },
    data: {
      ...(body.data.kind ? { kind: body.data.kind } : {}),
      ...(body.data.title ? { title: body.data.title } : {}),
      ...(body.data.href !== undefined ? { href: body.data.href } : {}),
      ...(body.data.imagePath ? { imagePath: body.data.imagePath } : {}),
      ...(body.data.width !== undefined ? { width: body.data.width } : {}),
      ...(body.data.height !== undefined ? { height: body.data.height } : {}),
      ...(body.data.placement ? { placement: body.data.placement } : {}),
      ...(body.data.isActive !== undefined ? { isActive: body.data.isActive } : {}),
      ...(body.data.startsAt !== undefined ? { startsAt: parseOptionalDate(body.data.startsAt) } : {}),
      ...(body.data.endsAt !== undefined ? { endsAt: parseOptionalDate(body.data.endsAt) } : {}),
      ...(body.data.minAmount !== undefined ? { minAmount: body.data.minAmount } : {}),
      ...(body.data.maxAmount !== undefined ? { maxAmount: body.data.maxAmount } : {}),
      ...(body.data.sortOrder !== undefined ? { sortOrder: body.data.sortOrder } : {}),
      ...(body.data.views !== undefined ? { views: body.data.views } : {}),
    },
  });

  revalidatePath("/admin/bannerlar");
  revalidatePath("/");
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
  await prisma.banner.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/bannerlar");
  revalidatePath("/");
  return Response.json({ ok: true });
}
