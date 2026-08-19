import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { couponDataFromBody, couponWriteSchema } from "@/lib/admin/coupon-input";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const itemSchema = couponWriteSchema;
const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Kupon listesi gerekli");

  let created = 0;
  let updated = 0;
  let failed = 0;
  for (const item of body.data.items) {
    try {
      const data = couponDataFromBody(item);
      const existing = await prisma.coupon.findUnique({ where: { code: data.code }, select: { id: true } });
      if (existing) {
        await prisma.coupon.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.coupon.create({ data });
        created += 1;
      }
    } catch {
      failed += 1;
    }
  }

  revalidatePath("/admin/kuponlar");
  return Response.json({ ok: true, created, updated, failed });
}
