import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  status: z.enum(["pending_payment", "paid", "preparing", "shipped", "completed", "cancelled", "failed"]).optional(),
  paymentStatus: z.enum(["pending", "success", "failure", "refunded"]).optional(),
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
  if (!body.data.status && !body.data.paymentStatus) return jsonError("Geçersiz durum");

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) return jsonError("Sipariş bulunamadı", 404);

  const nextStatus = body.data.status ?? order.status;
  const paidLike = ["paid", "preparing", "shipped", "completed"].includes(nextStatus);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: nextStatus,
      paidAt: paidLike ? (order.paidAt ?? new Date()) : order.paidAt,
    },
  });

  const payment = order.payments[0];
  if (payment && body.data.paymentStatus) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: body.data.paymentStatus },
    });
  } else if (payment && body.data.status && !body.data.paymentStatus) {
    const mapped =
      nextStatus === "failed"
        ? "failure"
        : nextStatus === "cancelled"
          ? payment.status
          : paidLike
            ? "success"
            : nextStatus === "pending_payment"
              ? "pending"
              : payment.status;
    if (mapped !== payment.status) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: mapped } });
    }
  }

  return Response.json({ ok: true, status: updated.status });
}
