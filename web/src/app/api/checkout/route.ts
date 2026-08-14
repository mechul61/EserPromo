import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createOrderFromCart } from "@/lib/commerce/orders";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().min(10).max(20),
  city: z.string().trim().min(2).max(40),
  district: z.string().trim().min(2).max(40),
  line: z.string().trim().min(6).max(200),
  postalCode: z.string().trim().max(10).optional(),
  deliveryMethod: z.enum(["address", "office"]).default("address"),
  invoiceType: z.enum(["individual", "corporate"]).default("individual"),
  paymentMethod: z.enum(["card", "transfer"]).default("card"),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Sipariş için giriş yapın.", 401);

  if (!rateLimit(clientKey(req, `checkout:${user.id}`), 10, 15 * 60 * 1000)) {
    return jsonError("Çok fazla deneme.", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Teslimat bilgilerini kontrol edin.");

  try {
    const { order, iyzicoReady } = await createOrderFromCart(user, body.data);
    return Response.json({
      ok: true,
      orderNumber: order.publicNumber,
      iyzicoReady,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Sipariş oluşturulamadı");
  }
}
