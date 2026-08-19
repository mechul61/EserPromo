import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { normalizeCouponCode } from "@/lib/commerce/coupons";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const source = await prisma.coupon.findUnique({ where: { id } });
  if (!source) return jsonError("Kupon bulunamadı", 404);

  const base = normalizeCouponCode(source.code).slice(0, 28);
  let code = `${base}-K`;
  for (let i = 2; i < 50; i += 1) {
    const taken = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
    if (!taken) break;
    code = `${base}-K${i}`;
  }

  const copy = await prisma.coupon.create({
    data: {
      code,
      name: `${source.name} (kopya)`,
      description: source.description,
      kind: source.kind,
      discountKind: source.discountKind,
      discountValue: source.discountValue,
      minOrderAmount: source.minOrderAmount,
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      usageLimit: source.usageLimit,
      usedCount: 0,
      perUserLimit: source.perUserLimit,
      isActive: false,
      productIds: source.productIds ?? undefined,
    },
    select: { id: true, code: true },
  });

  revalidatePath("/admin/kuponlar");
  return Response.json({ ok: true, id: copy.id, code: copy.code });
}
