import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const patchSchema = z
  .object({
    isActive: z.boolean().optional(),
    showOnHomepage: z.boolean().optional(),
    name: z.string().trim().min(1).max(200).optional(),
    title: z.string().trim().max(300).nullable().optional(),
    description: z.string().max(20000).nullable().optional(),
    color: z.string().trim().max(80).nullable().optional(),
    size: z.string().trim().max(80).nullable().optional(),
    sku: z.string().trim().min(1).max(80).optional(),
    price: z.number().positive().max(1_000_000).optional(),
    vatRate: z.number().min(0).max(40).optional(),
    stockTotal: z.number().int().min(0).max(10_000_000).optional(),
    categoryId: z.number().int().positive().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined));

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/kategoriler");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError("Geçersiz ürün");

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      title: true,
      description: true,
      sku: true,
      color: true,
      size: true,
      price: true,
      vatRate: true,
      stockTotal: true,
      categoryId: true,
      isActive: true,
      showOnHomepage: true,
      slug: true,
      removed: true,
    },
  });
  if (!product || product.removed) return jsonError("Ürün bulunamadı", 404);

  return Response.json({
    id: product.id,
    name: product.name,
    title: product.title,
    description: product.description,
    sku: product.sku,
    color: product.color,
    size: product.size,
    price: Number(product.price),
    vatRate: Number(product.vatRate),
    stockTotal: product.stockTotal,
    categoryId: product.categoryId,
    isActive: product.isActive,
    showOnHomepage: product.showOnHomepage,
    slug: product.slug,
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError("Geçersiz ürün");

  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, removed: true, price: true, discountLocked: true, name: true, slug: true, stockTotal: true },
  });
  if (!product || product.removed) return jsonError("Ürün bulunamadı", 404);

  if (body.data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: body.data.categoryId },
      select: { id: true, removed: true },
    });
    if (!category || category.removed) return jsonError("Kategori bulunamadı");
  }

  const locksContent = [
    body.data.name,
    body.data.title,
    body.data.description,
    body.data.color,
    body.data.size,
    body.data.sku,
    body.data.price,
    body.data.vatRate,
    body.data.stockTotal,
    body.data.categoryId,
  ].some((value) => value !== undefined);

  await prisma.product.update({
    where: { id },
    data: {
      ...(body.data.isActive !== undefined ? { isActive: body.data.isActive } : {}),
      ...(body.data.showOnHomepage !== undefined ? { showOnHomepage: body.data.showOnHomepage } : {}),
      ...(body.data.name !== undefined ? { name: body.data.name } : {}),
      ...(body.data.title !== undefined ? { title: body.data.title } : {}),
      ...(body.data.description !== undefined ? { description: body.data.description } : {}),
      ...(body.data.color !== undefined ? { color: body.data.color } : {}),
      ...(body.data.size !== undefined ? { size: body.data.size } : {}),
      ...(body.data.sku !== undefined ? { sku: body.data.sku } : {}),
      ...(body.data.price !== undefined ? { price: body.data.price } : {}),
      ...(body.data.vatRate !== undefined ? { vatRate: body.data.vatRate } : {}),
      ...(body.data.stockTotal !== undefined ? { stockTotal: body.data.stockTotal } : {}),
      ...(body.data.categoryId !== undefined ? { categoryId: body.data.categoryId } : {}),
      ...(locksContent ? { adminLocked: true } : {}),
    },
  });

  if (body.data.price !== undefined) {
    const { isFavoriteDiscount, notifyFavoriteDiscount } = await import("@/lib/commerce/favorite-alerts");
    if (
      isFavoriteDiscount({
        oldPrice: Number(product.price),
        newPrice: body.data.price,
        wasDiscounted: product.discountLocked,
        isDiscounted: product.discountLocked,
      })
    ) {
      void notifyFavoriteDiscount({
        productId: id,
        name: body.data.name ?? product.name,
        slug: product.slug,
        oldPrice: Number(product.price),
        newPrice: body.data.price,
        wentOnSale: false,
      }).catch((error) => console.error("favorite discount notify", id, error));
    }
  }

  if (body.data.stockTotal !== undefined && product.stockTotal <= 0 && body.data.stockTotal > 0) {
    const { notifyStockBackIn } = await import("@/lib/commerce/stock-alerts");
    void notifyStockBackIn({
      productId: id,
      name: body.data.name ?? product.name,
      slug: product.slug,
    }).catch((error) => console.error("stock back-in notify", id, error));
  }

  revalidateCatalog();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError("Geçersiz ürün");

  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, removed: true } });
  if (!product || product.removed) return jsonError("Ürün bulunamadı", 404);

  await prisma.cartItem.deleteMany({ where: { productId: id } });
  await prisma.favorite.deleteMany({ where: { productId: id } });
  await prisma.product.update({
    where: { id },
    data: { removed: true, isActive: false, showOnHomepage: false, adminLocked: true },
  });
  revalidateCatalog();
  return Response.json({ ok: true });
}
