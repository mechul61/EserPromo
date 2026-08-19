import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const bulkSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1).max(200),
    price: z.number().positive().max(1_000_000).optional(),
    pricePercent: z.number().min(-90).max(500).optional(),
    stockTotal: z.number().int().min(0).max(10_000_000).optional(),
    categoryId: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) =>
    [data.price, data.pricePercent, data.stockTotal, data.categoryId, data.isActive].some((value) => value !== undefined),
  );

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = bulkSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const ids = [...new Set(body.data.ids)];
  if (body.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: body.data.categoryId, removed: false },
      select: { id: true },
    });
    if (!category) return jsonError("Kategori bulunamadı");
  }

  if (body.data.pricePercent !== undefined) {
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, removed: false },
      select: { id: true, price: true },
    });
    const factor = 1 + body.data.pricePercent / 100;
    await prisma.$transaction(
      products.map((product) =>
        prisma.product.update({
          where: { id: product.id },
          data: {
            price: Math.max(0.01, Math.round(Number(product.price) * factor * 100) / 100),
            adminLocked: true,
          },
        }),
      ),
    );
  } else {
    await prisma.product.updateMany({
      where: { id: { in: ids }, removed: false },
      data: {
        ...(body.data.price !== undefined ? { price: body.data.price } : {}),
        ...(body.data.stockTotal !== undefined ? { stockTotal: body.data.stockTotal } : {}),
        ...(body.data.categoryId !== undefined ? { categoryId: body.data.categoryId } : {}),
        ...(body.data.isActive !== undefined ? { isActive: body.data.isActive } : {}),
        adminLocked: true,
      },
    });
  }

  revalidatePath("/admin/urunler");
  revalidatePath("/");
  return Response.json({ ok: true, count: ids.length });
}
