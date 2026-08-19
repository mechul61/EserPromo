import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { productGroupSlug, productSlug } from "@/lib/slug";

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(80),
  categoryId: z.number().int().positive(),
  price: z.number().positive().max(1_000_000),
  stockTotal: z.number().int().min(0).max(10_000_000).default(0),
  vatRate: z.number().min(0).max(40).optional(),
});

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/admin/urunler");
  revalidatePath("/admin/kategoriler");
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = createSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Ad, SKU, kategori ve fiyat gerekli");

  const category = await prisma.category.findFirst({
    where: { id: body.data.categoryId, removed: false },
    select: { id: true },
  });
  if (!category) return jsonError("Kategori bulunamadı");

  const skuTaken = await prisma.product.findFirst({
    where: { sku: body.data.sku, removed: false },
    select: { id: true },
  });
  if (skuTaken) return jsonError("Bu SKU zaten kullanılıyor");

  const maxId = await prisma.product.aggregate({ _max: { id: true } });
  const id = Math.max(9_000_000, (maxId._max.id ?? 0) + 1);
  const skuGroup = `local-${id}`;
  const slug = productSlug(body.data.name, id);

  await prisma.productGroup.create({
    data: {
      skuGroup,
      name: body.data.name,
      slug: productGroupSlug(body.data.name, skuGroup),
      categoryId: body.data.categoryId,
    },
  });

  const product = await prisma.product.create({
    data: {
      id,
      name: body.data.name,
      title: body.data.name,
      sku: body.data.sku,
      skuGroup,
      categoryId: body.data.categoryId,
      price: body.data.price,
      vatRate: body.data.vatRate ?? 20,
      stockTotal: body.data.stockTotal,
      slug,
      isActive: true,
      showOnHomepage: true,
      isGroupPrimary: true,
      adminLocked: true,
    },
    select: { id: true, slug: true },
  });

  revalidateCatalog();
  return Response.json({ ok: true, id: product.id, slug: product.slug });
}
