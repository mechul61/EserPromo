import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { cargoTrackingUrl, isCargoCompany } from "@/lib/commerce/cargo";
import { deleteAdminOrder, orderHasSuccessfulPayment } from "@/lib/commerce/order-delete";
import { notifyOrderDelivered, notifyOrderShipped, safeNotify } from "@/lib/commerce/email-templates";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const patchSchema = z.object({
  status: z.enum(["pending_payment", "paid", "preparing", "shipped", "completed", "cancelled", "failed"]).optional(),
  paymentStatus: z.enum(["pending", "success", "failure", "refunded"]).optional(),
  cargoCompany: z.string().max(40).optional(),
  trackingNo: z.string().max(80).optional(),
  trackingUrl: z.string().max(400).optional(),
});

const deleteSchema = z.object({
  confirmPaidDeletion: z.boolean().optional(),
});

function revalidateOrders() {
  revalidatePath("/admin/siparisler");
  revalidatePath("/admin");
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const body = deleteSchema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return jsonError("Geçersiz istek");

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      publicNumber: true,
      status: true,
      paidAt: true,
      payments: { select: { status: true } },
    },
  });
  if (!order) return jsonError("Sipariş bulunamadı", 404);

  const paid = orderHasSuccessfulPayment(order);
  if (paid && !body.data.confirmPaidDeletion) {
    return Response.json(
      {
        error: "Bu siparişin ödemesi yapılmış. Yine de silmek istiyor musunuz?",
        requiresConfirmation: true,
      },
      { status: 409 },
    );
  }

  await deleteAdminOrder(order.id);
  revalidateOrders();
  return Response.json({ ok: true, publicNumber: order.publicNumber });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz durum");
  if (
    !body.data.status &&
    !body.data.paymentStatus &&
    body.data.cargoCompany === undefined &&
    body.data.trackingNo === undefined &&
    body.data.trackingUrl === undefined
  ) {
    return jsonError("Geçersiz durum");
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) return jsonError("Sipariş bulunamadı", 404);

  const nextStatus = body.data.status ?? order.status;
  const paidLike = ["paid", "preparing", "shipped", "completed"].includes(nextStatus);
  const cargoCompany = body.data.cargoCompany ?? order.cargoCompany;
  const trackingNo = body.data.trackingNo ?? order.trackingNo;
  const trackingUrl =
    body.data.trackingUrl !== undefined
      ? body.data.trackingUrl
      : cargoTrackingUrl(cargoCompany, trackingNo, order.trackingUrl);

  if (body.data.cargoCompany && body.data.cargoCompany !== "" && !isCargoCompany(body.data.cargoCompany)) {
    return jsonError("Kargo firması geçersiz");
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: nextStatus,
      paidAt: paidLike ? (order.paidAt ?? new Date()) : order.paidAt,
      cargoCompany,
      trackingNo,
      trackingUrl,
      shippedAt: nextStatus === "shipped" ? (order.shippedAt ?? new Date()) : order.shippedAt,
      deliveredAt: nextStatus === "completed" ? (order.deliveredAt ?? new Date()) : order.deliveredAt,
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

  if (nextStatus === "shipped" && order.status !== "shipped") {
    await safeNotify(notifyOrderShipped(updated.id));
  }
  if (nextStatus === "completed" && order.status !== "completed") {
    await safeNotify(notifyOrderDelivered(updated.id));
  }

  revalidateOrders();
  return Response.json({ ok: true, status: updated.status });
}
