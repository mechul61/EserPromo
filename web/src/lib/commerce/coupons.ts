import { prisma } from "../db";
import type { Coupon, CouponDiscountKind, CouponKind } from "@prisma/client";

export const COUPON_KIND_LABEL: Record<CouponKind, string> = {
  general: "Genel",
  shipping: "Kargo",
  special: "Özel",
  product: "Ürün",
};

export const COUPON_DISCOUNT_LABEL: Record<CouponDiscountKind, string> = {
  percent: "Yüzde",
  amount: "Tutar",
};

export type CouponRuntimeStatus = "active" | "scheduled" | "expired" | "disabled";

export const COUPON_STATUS_LABEL: Record<CouponRuntimeStatus, string> = {
  active: "Aktif",
  scheduled: "Planlandı",
  expired: "Süresi Dolmuş",
  disabled: "Devre Dışı",
};

export type CartLineForCoupon = {
  productId: number;
  lineGross: number;
};

export function cartLinesForCoupon(
  items: Array<{
    productId: number;
    quantity: number;
    product: { price: { toString(): string } | number; vatRate: { toString(): string } | number };
  }>,
): CartLineForCoupon[] {
  return items.map((item) => {
    const net = Number(item.product.price) * item.quantity;
    const vatRate = Number(item.product.vatRate);
    const rate = Number.isFinite(vatRate) ? vatRate : 20;
    return {
      productId: item.productId,
      lineGross: net * (1 + rate / 100),
    };
  });
}

export type CouponSnapshot = Pick<
  Coupon,
  | "id"
  | "code"
  | "name"
  | "kind"
  | "discountKind"
  | "discountValue"
  | "minOrderAmount"
  | "startsAt"
  | "endsAt"
  | "usageLimit"
  | "usedCount"
  | "perUserLimit"
  | "isActive"
  | "productIds"
>;

function money(n: number) {
  return Math.round(n * 100) / 100;
}

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function parseCouponProductIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "number" ? item : Number(item)))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function couponRuntimeStatus(coupon: CouponSnapshot, now = new Date()): CouponRuntimeStatus {
  if (!coupon.isActive) return "disabled";
  if (now < coupon.startsAt) return "scheduled";
  if (now > coupon.endsAt) return "expired";
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return "expired";
  return "active";
}

export function couponDiscountLabel(coupon: CouponSnapshot) {
  const value = Number(coupon.discountValue);
  const amount =
    coupon.discountKind === "percent"
      ? `%${value.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`
      : `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (coupon.kind === "shipping") return `${amount} Kargo`;
  if (coupon.kind === "product") return `${amount} Üründe`;
  return `${amount} Sepette`;
}

function eligibleGross(coupon: CouponSnapshot, lines: CartLineForCoupon[], shippingTotal: number) {
  if (coupon.kind === "shipping") {
    return shippingTotal > 0 ? shippingTotal : lines.reduce((sum, line) => sum + line.lineGross, 0);
  }
  if (coupon.kind === "product") {
    const ids = new Set(parseCouponProductIds(coupon.productIds));
    if (ids.size === 0) return lines.reduce((sum, line) => sum + line.lineGross, 0);
    return lines.filter((line) => ids.has(line.productId)).reduce((sum, line) => sum + line.lineGross, 0);
  }
  return lines.reduce((sum, line) => sum + line.lineGross, 0);
}

export function computeCouponDiscount(
  coupon: CouponSnapshot,
  lines: CartLineForCoupon[],
  shippingTotal = 0,
) {
  const cartGross = money(lines.reduce((sum, line) => sum + line.lineGross, 0));
  const minOrder = Number(coupon.minOrderAmount);
  if (minOrder > 0 && cartGross < minOrder) {
    return {
      amount: 0,
      error: `Bu kupon için sepet en az ₺${minOrder.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} olmalı`,
    };
  }

  const base = money(eligibleGross(coupon, lines, shippingTotal));
  if (base <= 0) {
    return {
      amount: 0,
      error:
        coupon.kind === "product"
          ? "Bu kupon sepetteki ürünler için geçerli değil"
          : "Kupon uygulanacak tutar yok",
    };
  }

  const value = Number(coupon.discountValue);
  const raw = coupon.discountKind === "percent" ? (base * value) / 100 : value;
  const amount = money(Math.min(Math.max(0, raw), base, cartGross));
  if (amount <= 0) {
    return { amount: 0, error: "Kupon indirimi hesaplanamadı" };
  }
  return { amount };
}

export async function validateCouponForCart(
  coupon: CouponSnapshot,
  lines: CartLineForCoupon[],
  options: { userId?: string | null; shippingTotal?: number; now?: Date } = {},
) {
  const status = couponRuntimeStatus(coupon, options.now);
  if (status === "disabled") return { amount: 0, error: "Bu kupon devre dışı" };
  if (status === "scheduled") return { amount: 0, error: "Bu kupon henüz başlamadı" };
  if (status === "expired") return { amount: 0, error: "Bu kuponun süresi doldu" };
  if (coupon.kind === "special" && !options.userId) {
    return { amount: 0, error: "Özel kupon için giriş yapın" };
  }
  if (options.userId && coupon.perUserLimit > 0) {
    const used = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId: options.userId },
    });
    if (used >= coupon.perUserLimit) {
      return { amount: 0, error: "Bu kuponu daha önce kullandınız" };
    }
  }
  return computeCouponDiscount(coupon, lines, options.shippingTotal ?? 0);
}

export function couponPreview(coupon: CouponSnapshot, amount: number) {
  return {
    id: coupon.id,
    code: coupon.code,
    name: coupon.name,
    amount,
    label: couponDiscountLabel(coupon),
  };
}
