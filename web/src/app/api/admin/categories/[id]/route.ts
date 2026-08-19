import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { categorySlug } from "@/lib/slug";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const patchSchema = z
  .object({
    isActive: z.boolean().optional(),
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(20000).nullable().optional(),
    sortOrder: z.number().int().min(0).max(99999).optional(),
    parentId: z.number().int().positive().nullable().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined));

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/admin/kategoriler");
  revalidatePath("/admin/urunler");
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError("Geçersiz kategori");

  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      showOnHomepage: true,
      removed: true,
      _count: { select: { products: true } },
    },
  });
  if (!category || category.removed) return jsonError("Kategori bulunamadı", 404);
  return Response.json(category);
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

  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const category = await prisma.category.findUnique({ where: { id }, select: { id: true, removed: true } });
  if (!category || category.removed) return jsonError("Kategori bulunamadı", 404);

  const locksContent =
    body.data.name !== undefined ||
    body.data.description !== undefined ||
    body.data.sortOrder !== undefined ||
    body.data.parentId !== undefined;

  await prisma.category.update({
    where: { id },
    data: {
      ...(body.data.isActive !== undefined ? { showOnHomepage: body.data.isActive } : {}),
      ...(body.data.name !== undefined
        ? { name: body.data.name, slug: categorySlug(body.data.name, id) }
        : {}),
      ...(body.data.description !== undefined ? { description: body.data.description } : {}),
      ...(body.data.sortOrder !== undefined ? { sortOrder: body.data.sortOrder } : {}),
      ...(body.data.parentId !== undefined ? { parentId: body.data.parentId } : {}),
      ...(locksContent ? { adminLocked: true } : {}),
    },
  });
  revalidateCatalog();
  return Response.json({ ok: true, showOnHomepage: body.data.isActive });
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
  if (!Number.isInteger(id) || id <= 0) return jsonError("Geçersiz kategori");

  const category = await prisma.category.findUnique({ where: { id }, select: { id: true, removed: true } });
  if (!category || category.removed) return jsonError("Kategori bulunamadı", 404);

  const productIds = (
    await prisma.product.findMany({
      where: { categoryId: id, removed: false },
      select: { id: true },
    })
  ).map((row) => row.id);

  await prisma.$transaction([
    prisma.cartItem.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.favorite.deleteMany({ where: { productId: { in: productIds } } }),
    prisma.product.updateMany({
      where: { categoryId: id, removed: false },
      data: { removed: true, isActive: false, showOnHomepage: false, adminLocked: true },
    }),
    prisma.category.update({
      where: { id },
      data: { removed: true, showOnHomepage: false, adminLocked: true },
    }),
  ]);
  revalidateCatalog();
  return Response.json({ ok: true });
}
