import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { cargoTrackingUrl, isCargoCompany } from "@/lib/commerce/cargo";
import { notifyOrderDelivered, notifyOrderShipped, safeNotify } from "@/lib/commerce/email-templates";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(["ship", "complete", "return"]),
  cargoCompany: z.string().max(40).optional(),
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
  if (!body.success) return jsonError("Sipariş seçin");
  if (body.data.cargoCompany && !isCargoCompany(body.data.cargoCompany)) {
    return jsonError("Kargo firması geçersiz");
  }

  const ids = [...new Set(body.data.ids)];
  const orders = await prisma.order.findMany({ where: { id: { in: ids } } });
  const now = new Date();

  await Promise.all(
    orders.map((order) => {
      const company = body.data.cargoCompany || order.cargoCompany;
      const nextStatus = body.data.action === "ship" ? "shipped" : body.data.action === "complete" ? "completed" : "cancelled";
      return prisma.order.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          cargoCompany: company,
          trackingUrl: cargoTrackingUrl(company, order.trackingNo, order.trackingUrl),
          shippedAt: nextStatus === "shipped" ? (order.shippedAt ?? now) : order.shippedAt,
          deliveredAt: nextStatus === "completed" ? (order.deliveredAt ?? now) : order.deliveredAt,
        },
      });
    }),
  );

  const shippedIds = body.data.action === "ship" ? orders.filter((order) => order.status !== "shipped").map((order) => order.id) : [];
  const deliveredIds = body.data.action === "complete" ? orders.filter((order) => order.status !== "completed").map((order) => order.id) : [];
  await Promise.all(shippedIds.map((id) => safeNotify(notifyOrderShipped(id))));
  await Promise.all(deliveredIds.map((id) => safeNotify(notifyOrderDelivered(id))));

  revalidatePath("/admin/kargo");
  revalidatePath("/admin/siparisler");
  return Response.json({ ok: true, count: orders.length });
}
