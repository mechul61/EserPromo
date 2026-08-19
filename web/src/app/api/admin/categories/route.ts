import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { categorySlug } from "@/lib/slug";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  parentId: z.number().int().positive().nullable().optional(),
  description: z.string().max(20000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99999).optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = createSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Kategori adı gerekli");

  if (body.data.parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: body.data.parentId, removed: false },
      select: { id: true },
    });
    if (!parent) return jsonError("Üst kategori bulunamadı");
  }

  const maxId = await prisma.category.aggregate({ _max: { id: true } });
  const id = Math.max(9_000_000, (maxId._max.id ?? 0) + 1);

  await prisma.category.create({
    data: {
      id,
      name: body.data.name,
      slug: categorySlug(body.data.name, id),
      parentId: body.data.parentId ?? null,
      description: body.data.description ?? null,
      sortOrder: body.data.sortOrder ?? 0,
      showOnHomepage: true,
      adminLocked: true,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/kategoriler");
  return Response.json({ ok: true, id });
}
