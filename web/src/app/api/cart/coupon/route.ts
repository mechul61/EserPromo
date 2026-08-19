import { NextRequest } from "next/server";
import { z } from "zod";
import { applyCartCoupon, getOrCreateCart, removeCartCoupon } from "@/lib/commerce/cart";
import { cartLinesForCoupon, couponPreview, validateCouponForCart } from "@/lib/commerce/coupons";
import { getCurrentUser } from "@/lib/auth/session";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { productPath } from "@/lib/seo/urls";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

async function serializeCart(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  const user = await getCurrentUser();
  let coupon: ReturnType<typeof couponPreview> | null = null;
  if (cart.coupon) {
    const check = await validateCouponForCart(cart.coupon, cartLinesForCoupon(cart.items), {
      userId: user?.id,
    });
    if (!check.error) coupon = couponPreview(cart.coupon, check.amount);
  }
  return {
    id: cart.id,
    itemCount: cart.items.reduce((n, i) => n + i.quantity, 0),
    items: cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      name: item.product.name,
      color: item.product.color,
      sku: item.product.sku,
      price: formatPriceTry(item.product.price),
      href: productPath(item.product.slug),
      image: mediaUrl(item.product.images[0]?.localPath),
    })),
    coupon,
  };
}

const applySchema = z.object({
  code: z.string().trim().min(2).max(40),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const body = applySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Kupon kodu girin");
  try {
    const { cart } = await applyCartCoupon(body.data.code);
    return Response.json({ ok: true, ...(await serializeCart(cart)) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Kupon uygulanamadı");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  try {
    const cart = await removeCartCoupon();
    return Response.json({ ok: true, ...(await serializeCart(cart)) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Kupon kaldırılamadı");
  }
}
