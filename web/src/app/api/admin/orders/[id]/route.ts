import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  status: z.enum(["pending_payment", "paid", "preparing", "shipped", "completed", "cancelled", "failed"]),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz durum");

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return jsonError("Sipariş bulunamadı", 404);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: body.data.status,
      paidAt:
        body.data.status === "paid" || body.data.status === "preparing" || body.data.status === "shipped" || body.data.status === "completed"
          ? (order.paidAt ?? new Date())
          : order.paidAt,
    },
  });

  return Response.json({ ok: true, status: updated.status });
}
