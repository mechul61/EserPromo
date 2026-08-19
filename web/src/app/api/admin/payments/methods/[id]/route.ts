import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { isCheckoutMethodKey } from "@/lib/commerce/payments";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(200).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(1).max(20).optional(),
});

type Ctx = { params: Promise<{ id: string }> };

function revalidatePayments() {
  revalidatePath("/admin/odemeler");
  revalidatePath("/odeme");
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const existing = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!existing) return jsonError("Yöntem bulunamadı", 404);
  if (body.data.isActive === true && !isCheckoutMethodKey(existing.key)) {
    return jsonError("Bu sağlayıcı henüz bağlı değil; kasada açılamaz.");
  }

  await prisma.paymentMethod.update({
    where: { id },
    data: {
      ...(body.data.name ? { name: body.data.name } : {}),
      ...(body.data.description !== undefined ? { description: body.data.description } : {}),
      ...(body.data.isActive !== undefined ? { isActive: body.data.isActive } : {}),
      ...(body.data.sortOrder !== undefined ? { sortOrder: body.data.sortOrder } : {}),
    },
  });
  revalidatePayments();
  return Response.json({ ok: true });
}
