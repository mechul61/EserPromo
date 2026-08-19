import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { categorySlug } from "@/lib/slug";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const itemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  parentName: z.string().trim().max(200).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99999).optional(),
  visible: z.boolean().optional(),
});

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
  if (!body.success) return jsonError("CSV/JSON içinde kategori listesi gerekli");

  const existing = await prisma.category.findMany({
    where: { removed: false },
    select: { id: true, name: true },
  });
  const byName = new Map(existing.map((row) => [row.name.toLocaleLowerCase("tr"), row.id]));
  let created = 0;
  let updated = 0;

  for (const item of body.data.items) {
    const key = item.name.toLocaleLowerCase("tr");
    const parentId = item.parentName
      ? byName.get(item.parentName.toLocaleLowerCase("tr")) ?? null
      : null;
    const currentId = byName.get(key);
    if (currentId) {
      await prisma.category.update({
        where: { id: currentId },
        data: {
          ...(item.sortOrder !== undefined ? { sortOrder: item.sortOrder } : {}),
          ...(item.visible !== undefined ? { showOnHomepage: item.visible } : {}),
          ...(item.parentName !== undefined ? { parentId } : {}),
          adminLocked: true,
        },
      });
      updated += 1;
      continue;
    }

    const maxId = await prisma.category.aggregate({ _max: { id: true } });
    const id = Math.max(9_000_000, (maxId._max.id ?? 0) + 1);
    await prisma.category.create({
      data: {
        id,
        name: item.name,
        slug: categorySlug(item.name, id),
        parentId,
        sortOrder: item.sortOrder ?? 0,
        showOnHomepage: item.visible ?? true,
        adminLocked: true,
      },
    });
    byName.set(key, id);
    created += 1;
  }

  revalidatePath("/");
  revalidatePath("/admin/kategoriler");
  return Response.json({ ok: true, created, updated });
}
