import { NextRequest } from "next/server";
import { z } from "zod";
import {
  addToCart,
  clearCart,
  getOrCreateCart,
  setCartItemQuantity,
  setCartQuantities,
} from "@/lib/commerce/cart";
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

export async function GET() {
  const cart = await getOrCreateCart();
  return Response.json(await serializeCart(cart));
}

const addSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100000).default(1),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const body = addSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz ürün");
  try {
    const cart = await addToCart(body.data.productId, body.data.quantity);
    return Response.json(await serializeCart(cart));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Sepete eklenemedi");
  }
}

const patchSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(0).max(100000),
});

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");
  try {
    const cart = await setCartItemQuantity(body.data.productId, body.data.quantity);
    return Response.json(await serializeCart(cart));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Güncellenemedi");
  }
}

const putSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(0).max(100000),
    }),
  ),
});

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const body = putSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");
  try {
    const cart = await setCartQuantities(body.data.items);
    return Response.json(await serializeCart(cart));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Güncellenemedi");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  try {
    const cart = await clearCart();
    return Response.json(await serializeCart(cart));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Sepet temizlenemedi");
  }
}
