import type { CouponRuntimeStatus } from "@/lib/commerce/coupons";

export type CouponKpi = {
  label: string;
  value: string;
  hint: string;
  color: string;
  icon: "total" | "active" | "usage" | "discount" | "expired";
};

export type CouponRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  kind: "general" | "shipping" | "special" | "product";
  discountKind: "percent" | "amount";
  discountValue: number;
  minOrderAmount: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  productIds: number[];
  status: CouponRuntimeStatus;
  discountLabel: string;
};

export type CouponMonthStats = {
  usage: number;
  usageDelta: number;
  discount: number;
  discountDelta: number;
  average: number;
  averageDelta: number;
  topCode: string;
  topUsage: number;
};
