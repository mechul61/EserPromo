import { cookies } from "next/headers";
import { prisma } from "../db";
import { randomToken } from "../security/crypto";
import { getCurrentUser } from "../auth/session";
import { couponPreview, cartLinesForCoupon, normalizeCouponCode, validateCouponForCart } from "./coupons";
import { getSiteSettings, stockAllowsSale, stockMaxQty } from "@/lib/site-settings";

export const CART_COOKIE = "ep_cart";

function cookieSecure() {
  return process.env.NODE_ENV === "production";
}

async function setGuestCookie(token: string) {
  const jar = await cookies();
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Sayfa render’ında kullanın — çerez yazmaz, yoksa sepet oluşturmaz. */
export async function getCart() {
  const user = await getCurrentUser();
  const jar = await cookies();
  const guestToken = jar.get(CART_COOKIE)?.value;

  if (user) {
    return prisma.cart.findUnique({
      where: { userId: user.id },
      include: cartInclude,
    });
  }

  if (!guestToken) return null;
  return prisma.cart.findUnique({
    where: { guestToken },
    include: cartInclude,
  });
}

export async function getOrCreateCart() {
  const user = await getCurrentUser();
  const jar = await cookies();
  const guestToken = jar.get(CART_COOKIE)?.value;

  if (user) {
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: cartInclude,
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: cartInclude,
      });
    }
    if (guestToken && guestToken !== cart.guestToken) {
      await mergeGuestCart(cart.id, guestToken);
      cart = await prisma.cart.findUniqueOrThrow({
        where: { id: cart.id },
        include: cartInclude,
      });
    }
    return cart;
  }

  if (guestToken) {
    const existing = await prisma.cart.findUnique({
      where: { guestToken },
      include: cartInclude,
    });
    if (existing) return existing;
  }

  const token = randomToken(24);
  const cart = await prisma.cart.create({
    data: { guestToken: token },
    include: cartInclude,
  });
  await setGuestCookie(token);
  return cart;
}

async function mergeGuestCart(userCartId: string, guestToken: string) {
  const guest = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: true },
  });
  if (!guest || guest.id === userCartId) return;

  for (const item of guest.items) {
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: userCartId, productId: item.productId },
      },
      create: {
        cartId: userCartId,
        productId: item.productId,
        quantity: item.quantity,
      },
      update: { quantity: { increment: item.quantity } },
    });
  }
  if (guest.couponId) {
    const userCart = await prisma.cart.findUnique({
      where: { id: userCartId },
      select: { couponId: true },
    });
    if (!userCart?.couponId) {
      await prisma.cart.update({
        where: { id: userCartId },
        data: { couponId: guest.couponId },
      });
    }
  }
  await prisma.cart.delete({ where: { id: guest.id } });
}

const cartInclude = {
  coupon: true,
  items: {
    include: {
      product: {
        include: {
          images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
          group: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function addToCart(productId: number, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
    throw new Error("Geçersiz adet");
  }
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive || product.removed) throw new Error("Ürün bulunamadı");
  const settings = await getSiteSettings();
  if (!stockAllowsSale(product.stockTotal, settings)) throw new Error("Bu ürün stokta yok");
  const maxQty = stockMaxQty(product.stockTotal, settings);
  if (quantity > maxQty) {
    throw new Error(`Stokta ${product.stockTotal} adet var`);
  }

  const cart = await getOrCreateCart();
  const existing = cart.items.find((i) => i.productId === productId);
  const nextQty = (existing?.quantity ?? 0) + quantity;
  if (nextQty > maxQty) {
    const remaining = maxQty - (existing?.quantity ?? 0);
    throw new Error(
      remaining <= 0
        ? "Bu ürün sepetinizde stok adedine ulaştı"
        : `Stokta ${product.stockTotal} adet var. En fazla ${remaining} adet ekleyebilirsiniz`,
    );
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity: nextQty },
  });

  return prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });
}

export async function setCartItemQuantity(productId: number, quantity: number) {
  const cart = await getOrCreateCart();
  if (quantity < 1) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  } else {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    const settings = await getSiteSettings();
    if (!product || product.removed || !product.isActive || !stockAllowsSale(product.stockTotal, settings) || quantity > stockMaxQty(product.stockTotal, settings)) {
      throw new Error(
        !product ? "Ürün bulunamadı" : `Stokta ${product.stockTotal} adet var`,
      );
    }
    await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
    });
  }
  return prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });
}

export async function setCartQuantities(
  items: Array<{ productId: number; quantity: number }>,
) {
  const cart = await getOrCreateCart();
  for (const item of items) {
    if (item.quantity < 1) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId: item.productId },
      });
      continue;
    }
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    const settings = await getSiteSettings();
    if (!product || item.quantity > stockMaxQty(product.stockTotal, settings) || !stockAllowsSale(product.stockTotal, settings)) {
      throw new Error(
        !product ? "Ürün bulunamadı" : `Stokta ${product.stockTotal} adet var`,
      );
    }
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
    });
    if (!existing) continue;
    await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
      data: { quantity: item.quantity },
    });
  }
  return prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });
}

export async function clearCart() {
  const cart = await getOrCreateCart();
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  return prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });
}

export async function applyCartCoupon(code: string) {
  const cart = await getOrCreateCart();
  if (cart.items.length === 0) throw new Error("Sepet boş");
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizeCouponCode(code) },
  });
  if (!coupon) throw new Error("Kupon bulunamadı");
  const user = await getCurrentUser();
  const check = await validateCouponForCart(coupon, cartLinesForCoupon(cart.items), {
    userId: user?.id,
  });
  if (check.error) throw new Error(check.error);
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });
  const next = await prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });
  return { cart: next, preview: couponPreview(coupon, check.amount) };
}

export async function removeCartCoupon() {
  const cart = await getOrCreateCart();
  await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  return prisma.cart.findUniqueOrThrow({
    where: { id: cart.id },
    include: cartInclude,
  });
}

export function cartItemCount(
  cart: { items: Array<{ quantity: number }> } | null,
): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartMoneySummary(
  items: Array<{
    quantity: number;
    product: { name: string; price: { toString(): string } | number; vatRate: { toString(): string } | number };
  }>,
) {
  let subtotal = 0;
  let vat = 0;
  let quantity = 0;
  for (const item of items) {
    const net = Number(item.product.price) * item.quantity;
    const vatRate = Number(item.product.vatRate);
    subtotal += net;
    vat += net * ((Number.isFinite(vatRate) ? vatRate : 20) / 100);
    quantity += item.quantity;
  }
  return {
    quantity,
    lines: items.length,
    subtotal,
    vat,
    grand: subtotal + vat,
    preview: items
      .slice(0, 2)
      .map((item) => `${item.product.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`)
      .join(", "),
  };
}

const ACTIVE_CART_WHERE = { items: { some: {} } };

export async function countActiveCarts() {
  return prisma.cart.count({ where: ACTIVE_CART_WHERE });
}

/** Header için — yoksa yeni sepet açmaz (bot/crawler şişmesini önler). */
export async function peekCartCount(): Promise<number> {
  const user = await getCurrentUser();
  if (user) {
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });
    return cartItemCount(cart);
  }
  const jar = await cookies();
  const guestToken = jar.get(CART_COOKIE)?.value;
  if (!guestToken) return 0;
  const cart = await prisma.cart.findUnique({
    where: { guestToken },
    include: { items: true },
  });
  return cartItemCount(cart);
}

export async function appliedCouponFor(
  cart: Awaited<ReturnType<typeof getCart>>,
) {
  if (!cart?.coupon) return null;
  const user = await getCurrentUser();
  const check = await validateCouponForCart(cart.coupon, cartLinesForCoupon(cart.items), {
    userId: user?.id,
  });
  if (check.error) return null;
  return couponPreview(cart.coupon, check.amount);
}

