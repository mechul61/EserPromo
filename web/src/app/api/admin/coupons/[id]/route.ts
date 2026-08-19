import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { couponDataFromBody, couponWriteSchema } from "@/lib/admin/coupon-input";
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
  const body = couponWriteSchema.partial().safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Kupon bilgilerini kontrol edin");

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) return jsonError("Kupon bulunamadı", 404);

  const merged = {
    code: body.data.code ?? existing.code,
    name: body.data.name ?? existing.name,
    description: body.data.description ?? existing.description ?? "",
    kind: body.data.kind ?? existing.kind,
    discountKind: body.data.discountKind ?? existing.discountKind,
    discountValue: body.data.discountValue ?? Number(existing.discountValue),
    minOrderAmount: body.data.minOrderAmount ?? Number(existing.minOrderAmount),
    startsAt: body.data.startsAt ?? existing.startsAt.toISOString(),
    endsAt: body.data.endsAt ?? existing.endsAt.toISOString(),
    usageLimit: body.data.usageLimit === undefined ? existing.usageLimit : body.data.usageLimit,
    perUserLimit: body.data.perUserLimit ?? existing.perUserLimit,
    isActive: body.data.isActive ?? existing.isActive,
    productIds: body.data.productIds ?? (Array.isArray(existing.productIds) ? existing.productIds as number[] : []),
  };

  let data;
  try {
    data = couponDataFromBody(merged);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Geçersiz kupon");
  }

  if (data.code !== existing.code) {
    const taken = await prisma.coupon.findUnique({ where: { code: data.code }, select: { id: true } });
    if (taken) return jsonError("Bu kupon kodu zaten var");
  }

  await prisma.coupon.update({ where: { id }, data });
  revalidatePath("/admin/kuponlar");
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
  await prisma.coupon.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/kuponlar");
  return Response.json({ ok: true });
}
