import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const PAGE_SIZE = 24;

const bulkSchema = z.object({
  showOnHomepage: z.boolean(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError("Geçersiz kategori");

  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!category) return jsonError("Kategori bulunamadı", 404);

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const where = {
    categoryId: id,
    removed: false,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { stockTotal: "desc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        title: true,
        sku: true,
        skuGroup: true,
        slug: true,
        color: true,
        size: true,
        stockTotal: true,
        price: true,
        vatRate: true,
        categoryId: true,
        isActive: true,
        showOnHomepage: true,
        isGroupPrimary: true,
        images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { localPath: true } },
      },
    }),
  ]);

  return Response.json({
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    items: products.map((product) => ({
      id: product.id,
      name: product.name,
      title: product.title,
      sku: product.sku,
      skuGroup: product.skuGroup,
      slug: product.slug,
      color: product.color,
      size: product.size,
      stockTotal: product.stockTotal,
      price: Number(product.price),
      vatRate: Number(product.vatRate),
      categoryId: product.categoryId,
      isActive: product.isActive,
      showOnHomepage: product.showOnHomepage,
      isGroupPrimary: product.isGroupPrimary,
      image: product.images[0]?.localPath ?? null,
    })),
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
  if (!Number.isInteger(id) || id <= 0) return jsonError("Geçersiz kategori");

  const body = bulkSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!category) return jsonError("Kategori bulunamadı", 404);

  const result = await prisma.product.updateMany({
    where: { categoryId: id },
    data: { showOnHomepage: body.data.showOnHomepage },
  });
  revalidatePath("/");
  revalidatePath("/admin/kategoriler");
  revalidatePath("/admin/urunler");
  return Response.json({ ok: true, count: result.count, showOnHomepage: body.data.showOnHomepage });
}
