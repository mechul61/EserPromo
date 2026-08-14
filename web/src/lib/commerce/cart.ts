import { cookies } from "next/headers";
import { prisma } from "../db";
import { randomToken } from "../security/crypto";
import { getCurrentUser } from "../auth/session";

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
  await prisma.cart.delete({ where: { id: guest.id } });
}

const cartInclude = {
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
  if (!product || !product.isActive) throw new Error("Ürün bulunamadı");
  if (product.stockTotal < quantity) throw new Error("Yetersiz stok");

  const cart = await getOrCreateCart();
  const existing = cart.items.find((i) => i.productId === productId);
  const nextQty = (existing?.quantity ?? 0) + quantity;
  if (nextQty > product.stockTotal) throw new Error("Yetersiz stok");

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
    if (!product || quantity > product.stockTotal) throw new Error("Yetersiz stok");
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

export function cartItemCount(
  cart: { items: Array<{ quantity: number }> } | null,
): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
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
