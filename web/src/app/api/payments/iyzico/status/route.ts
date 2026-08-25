import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  orderNumber: z.string().trim().min(3).max(40),
});

export async function GET(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const parsed = schema.safeParse({
    orderNumber: req.nextUrl.searchParams.get("orderNumber") ?? "",
  });
  if (!parsed.success) return jsonError("Geçersiz sipariş numarası");

  const order = await prisma.order.findFirst({
    where: { publicNumber: parsed.data.orderNumber, userId: user.id },
    select: {
      publicNumber: true,
      status: true,
      payments: {
        where: { provider: "iyzico" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, errorMessage: true },
      },
    },
  });
  if (!order) return jsonError("Sipariş bulunamadı", 404);

  const payment = order.payments[0] ?? null;
  return Response.json({
    ok: true,
    orderNumber: order.publicNumber,
    orderStatus: order.status,
    paymentStatus: payment?.status ?? "missing",
    message: payment?.errorMessage ?? "",
  });
}
