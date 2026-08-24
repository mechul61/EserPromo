import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { initializeIyzicoCheckout } from "@/lib/payments/iyzico";
import { clientIp } from "@/lib/auth/login-meta";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  orderNumber: z.string().trim().min(3).max(40),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  if (!rateLimit(clientKey(req, `iyzico-start:${user.id}`), 20, 15 * 60 * 1000)) {
    return jsonError("Çok fazla deneme.", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz sipariş numarası");

  try {
    const checkout = await initializeIyzicoCheckout({
      orderPublicNumber: body.data.orderNumber,
      userId: user.id,
      clientIp: clientIp(req),
    });
    return Response.json({ ok: true, ...checkout });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Ödeme başlatılamadı");
  }
}
