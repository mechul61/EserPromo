import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const itemSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  price: z.number().positive().max(1_000_000).optional(),
  stockTotal: z.number().int().min(0).max(10_000_000).optional(),
  isActive: z.boolean().optional(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(1000),
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
  if (!body.success) return jsonError("SKU listesi gerekli");

  let updated = 0;
  let missing = 0;
  for (const item of body.data.items) {
    if (item.price === undefined && item.stockTotal === undefined && item.isActive === undefined) continue;
    const product = await prisma.product.findFirst({
      where: { sku: item.sku, removed: false },
      select: { id: true },
    });
    if (!product) {
      missing += 1;
      continue;
    }
    await prisma.product.update({
      where: { id: product.id },
      data: {
        ...(item.price !== undefined ? { price: item.price } : {}),
        ...(item.stockTotal !== undefined ? { stockTotal: item.stockTotal } : {}),
        ...(item.isActive !== undefined ? { isActive: item.isActive } : {}),
        adminLocked: true,
      },
    });
    updated += 1;
  }

  revalidatePath("/admin/urunler");
  revalidatePath("/");
  return Response.json({ ok: true, updated, missing });
}
