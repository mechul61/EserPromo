import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { subscribeStockNotify } from "@/lib/commerce/stock-alerts";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  email: z.string().trim().email().max(160),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return jsonError("Geçersiz ürün");

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçerli bir e-posta girin");

  const user = await getCurrentUser();
  const result = await subscribeStockNotify({
    productId: id,
    email: body.data.email,
    userId: user?.id ?? null,
  });

  if (!result.ok) return jsonError(result.error);

  return Response.json({ ok: true });
}
