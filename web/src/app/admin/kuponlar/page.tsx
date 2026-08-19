import { CouponsPageView } from "@/components/admin/CouponsPageView";
import type { CouponKpi, CouponRow, CouponMonthStats } from "@/components/admin/coupon-types";
import {
  couponDiscountLabel,
  couponRuntimeStatus,
  parseCouponProductIds,
} from "@/lib/commerce/coupons";
import { prisma } from "@/lib/db";
import { formatPriceTry } from "@/lib/media";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kuponlar | Yönetim" };

export default async function AdminCouponsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [coupons, allDiscount, monthUsage, prevMonthUsage, monthDiscount, prevMonthDiscount, top] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { redemptions: true } } },
    }),
    prisma.couponRedemption.aggregate({ _sum: { amount: true } }),
    prisma.couponRedemption.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.couponRedemption.count({
      where: { createdAt: { gte: prevMonthStart, lt: monthStart } },
    }),
    prisma.couponRedemption.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.couponRedemption.aggregate({
      _sum: { amount: true },
      where: { createdAt: { gte: prevMonthStart, lt: monthStart } },
    }),
    prisma.coupon.findFirst({
      orderBy: { usedCount: "desc" },
      select: { code: true, usedCount: true },
    }),
  ]);

  const rows: CouponRow[] = coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    name: coupon.name,
    description: coupon.description,
    kind: coupon.kind,
    discountKind: coupon.discountKind,
    discountValue: Number(coupon.discountValue),
    minOrderAmount: Number(coupon.minOrderAmount),
    startsAt: coupon.startsAt.toISOString(),
    endsAt: coupon.endsAt.toISOString(),
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    perUserLimit: coupon.perUserLimit,
    isActive: coupon.isActive,
    productIds: parseCouponProductIds(coupon.productIds),
    status: couponRuntimeStatus(coupon, now),
    discountLabel: couponDiscountLabel(coupon),
  }));

  const active = rows.filter((row) => row.status === "active").length;
  const expiredMonth = rows.filter(
    (row) => row.status === "expired" && new Date(row.endsAt) >= monthStart,
  ).length;
  const totalUsage = rows.reduce((sum, row) => sum + row.usedCount, 0);
  const activePct = rows.length ? (active / rows.length) * 100 : 0;

  const kpis: CouponKpi[] = [
    { label: "Toplam Kupon", value: rows.length.toLocaleString("tr-TR"), hint: "Tüm zamanlar", color: "bg-[#2f6bff]", icon: "total" },
    { label: "Aktif Kupon", value: active.toLocaleString("tr-TR"), hint: `↑ %${activePct.toFixed(1).replace(".", ",")} aktif`, color: "bg-[#22c55e]", icon: "active" },
    { label: "Toplam Kullanım", value: totalUsage.toLocaleString("tr-TR"), hint: "Tüm zamanlar", color: "bg-[#f59e0b]", icon: "usage" },
    {
      label: "Toplam İndirim",
      value: `₺${formatPriceTry(Number(allDiscount._sum.amount ?? 0))}`,
      hint: "Tüm zamanlar",
      color: "bg-[#7c3aed]",
      icon: "discount",
    },
    { label: "Süresi Dolan", value: expiredMonth.toLocaleString("tr-TR"), hint: "Bu ay", color: "bg-[#ec4899]", icon: "expired" },
  ];

  function delta(current: number, previous: number) {
    if (previous <= 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  const monthDiscountValue = Number(monthDiscount._sum.amount ?? 0);
  const prevDiscountValue = Number(prevMonthDiscount._sum.amount ?? 0);
  const avgUsage = rows.length ? totalUsage / rows.length : 0;

  const monthStats: CouponMonthStats = {
    usage: monthUsage,
    usageDelta: delta(monthUsage, prevMonthUsage),
    discount: monthDiscountValue,
    discountDelta: delta(monthDiscountValue, prevDiscountValue),
    average: avgUsage,
    averageDelta: 0,
    topCode: top?.code ?? "—",
    topUsage: top?.usedCount ?? 0,
  };

  return <CouponsPageView coupons={rows} kpis={kpis} monthStats={monthStats} />;
}
