import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { couponDataFromBody, couponWriteSchema } from "@/lib/admin/coupon-input";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

function revalidateCoupons() {
  revalidatePath("/admin/kuponlar");
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = couponWriteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Kupon bilgilerini kontrol edin");

  let data;
  try {
    data = couponDataFromBody(body.data);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Geçersiz kupon");
  }

  const taken = await prisma.coupon.findUnique({ where: { code: data.code }, select: { id: true } });
  if (taken) return jsonError("Bu kupon kodu zaten var");

  const coupon = await prisma.coupon.create({ data, select: { id: true, code: true } });
  revalidateCoupons();
  return Response.json({ ok: true, id: coupon.id, code: coupon.code });
}
