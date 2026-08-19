import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int().min(1).max(20) })).min(1).max(20),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Sıralama geçersiz");

  await prisma.$transaction(
    body.data.items.map((item) =>
      prisma.paymentMethod.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
    ),
  );
  revalidatePath("/admin/odemeler");
  revalidatePath("/odeme");
  return Response.json({ ok: true });
}
