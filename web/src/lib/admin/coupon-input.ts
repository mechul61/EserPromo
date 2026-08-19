import { z } from "zod";
import { normalizeCouponCode, parseCouponProductIds } from "@/lib/commerce/coupons";

export const couponWriteSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  kind: z.enum(["general", "shipping", "special", "product"]).default("general"),
  discountKind: z.enum(["percent", "amount"]),
  discountValue: z.number().positive().max(1_000_000),
  minOrderAmount: z.number().min(0).max(1_000_000).optional(),
  startsAt: z.string().min(8),
  endsAt: z.string().min(8),
  usageLimit: z.number().int().positive().max(1_000_000).nullable().optional(),
  perUserLimit: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
  productIds: z.array(z.number().int().positive()).max(200).optional(),
});

export function couponDataFromBody(body: z.infer<typeof couponWriteSchema>) {
  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Geçerlilik tarihlerini kontrol edin");
  }
  if (endsAt <= startsAt) throw new Error("Bitiş tarihi başlangıçtan sonra olmalı");
  if (body.discountKind === "percent" && body.discountValue > 100) {
    throw new Error("Yüzde indirim en fazla 100 olabilir");
  }
  const productIds = body.kind === "product" ? parseCouponProductIds(body.productIds ?? []) : [];
  return {
    code: normalizeCouponCode(body.code),
    name: body.name.trim(),
    description: body.description?.trim() || null,
    kind: body.kind,
    discountKind: body.discountKind,
    discountValue: body.discountValue,
    minOrderAmount: body.minOrderAmount ?? 0,
    startsAt,
    endsAt,
    usageLimit: body.usageLimit ?? null,
    perUserLimit: body.perUserLimit ?? 1,
    isActive: body.isActive ?? true,
    productIds: productIds.length ? productIds : null,
  };
}
