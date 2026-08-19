import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { parseOptionalDate, popupPatchSchema } from "@/lib/admin/popup-input";
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
  const body = popupPatchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const existing = await prisma.popup.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return jsonError("Popup bulunamadı", 404);

  await prisma.popup.update({
    where: { id },
    data: {
      ...(body.data.title ? { title: body.data.title } : {}),
      ...(body.data.description !== undefined ? { description: body.data.description } : {}),
      ...(body.data.kind ? { kind: body.data.kind } : {}),
      ...(body.data.placement ? { placement: body.data.placement } : {}),
      ...(body.data.device ? { device: body.data.device } : {}),
      ...(body.data.audience ? { audience: body.data.audience } : {}),
      ...(body.data.isDraft !== undefined ? { isDraft: body.data.isDraft } : {}),
      ...(body.data.isActive !== undefined ? { isActive: body.data.isActive } : {}),
      ...(body.data.imagePath !== undefined ? { imagePath: body.data.imagePath } : {}),
      ...(body.data.heading !== undefined ? { heading: body.data.heading } : {}),
      ...(body.data.body !== undefined ? { body: body.data.body } : {}),
      ...(body.data.ctaLabel !== undefined ? { ctaLabel: body.data.ctaLabel } : {}),
      ...(body.data.ctaHref !== undefined ? { ctaHref: body.data.ctaHref } : {}),
      ...(body.data.couponCode !== undefined ? { couponCode: body.data.couponCode } : {}),
      ...(body.data.startsAt !== undefined ? { startsAt: parseOptionalDate(body.data.startsAt) } : {}),
      ...(body.data.endsAt !== undefined ? { endsAt: parseOptionalDate(body.data.endsAt) } : {}),
      ...(body.data.delaySeconds !== undefined ? { delaySeconds: body.data.delaySeconds } : {}),
      ...(body.data.frequencyHours !== undefined ? { frequencyHours: body.data.frequencyHours } : {}),
      ...(body.data.sortOrder !== undefined ? { sortOrder: body.data.sortOrder } : {}),
    },
  });

  revalidatePath("/admin/popuplar");
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
  await prisma.popup.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/popuplar");
  revalidatePath("/");
  return Response.json({ ok: true });
}
