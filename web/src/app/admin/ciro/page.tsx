import { AdminHeading } from "@/components/admin/AdminChrome";
import { RevenueCards, type RevenueOrderRow } from "@/components/admin/RevenueCards";
import { prisma } from "@/lib/db";
import {
  LOST_STATUSES,
  PENDING_STATUSES,
  REVENUE_PERIODS,
  REVENUE_STATUSES,
  lastMonthStarts,
  moneyNum,
  monthKeyIstanbul,
  parseRevenuePeriod,
  revenueCreatedAtFilter,
} from "@/lib/commerce/revenue";
import Link from "next/link";

export const metadata = { title: "Ciro | Yönetim" };

function paymentLabel(provider?: string | null) {
  if (provider === "iyzico") return "Kredi kartı";
  if (provider === "transfer") return "Havale / EFT";
  return provider || "—";
}

function toOrderRow(order: {
  id: string;
  publicNumber: string;
  createdAt: Date;
  paidAt: Date | null;
  status: string;
  grandTotal: unknown;
  subtotal: unknown;
  vatTotal: unknown;
  user: { id: string; name: string; email: string };
  payments: Array<{ provider: string; status: string }>;
  shipPhone: string;
}): RevenueOrderRow {
  return {
    id: order.id,
    publicNumber: order.publicNumber,
    userId: order.user.id,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    status: order.status,
    paymentStatus: order.payments[0]?.status ?? "pending",
    grandTotal: moneyNum(order.grandTotal as { toString(): string }),
    subtotal: moneyNum(order.subtotal as { toString(): string }),
    vatTotal: moneyNum(order.vatTotal as { toString(): string }),
    customer: order.user.name,
    email: order.user.email,
    phone: order.shipPhone,
    payment: paymentLabel(order.payments[0]?.provider),
  };
}

const orderInclude = {
  user: { select: { id: true, name: true, email: true } },
  payments: { orderBy: { createdAt: "desc" as const }, take: 1, select: { provider: true, status: true } },
};

export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = parseRevenuePeriod(rawPeriod);
  const createdAt = revenueCreatedAtFilter(period);
  const dateWhere = Object.keys(createdAt).length ? { createdAt } : {};
  const months = lastMonthStarts(6);

  const [paidParts, pendingParts, lostParts, byPayment, monthOrders, paidOrders, pendingOrders, lostOrders] =
    await Promise.all([
      prisma.order.aggregate({
        where: { ...dateWhere, status: { in: [...REVENUE_STATUSES] } },
        _sum: { grandTotal: true, subtotal: true, vatTotal: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { ...dateWhere, status: { in: [...PENDING_STATUSES] } },
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { ...dateWhere, status: { in: [...LOST_STATUSES] } },
        _sum: { grandTotal: true },
        _count: { _all: true },
      }),
      prisma.payment.groupBy({
        by: ["provider"],
        where: { ...dateWhere, status: "success" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: months[0]?.gte },
          status: { in: [...REVENUE_STATUSES] },
        },
        select: { createdAt: true, grandTotal: true },
      }),
      prisma.order.findMany({
        where: { ...dateWhere, status: { in: [...REVENUE_STATUSES] } },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: orderInclude,
      }),
      prisma.order.findMany({
        where: { ...dateWhere, status: { in: [...PENDING_STATUSES] } },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: orderInclude,
      }),
      prisma.order.findMany({
        where: { ...dateWhere, status: { in: [...LOST_STATUSES] } },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: orderInclude,
      }),
    ]);

  const collected = moneyNum(paidParts._sum.grandTotal);
  const collectedCount = paidParts._count._all;
  const pendingTotal = moneyNum(pendingParts._sum.grandTotal);
  const lostTotal = moneyNum(lostParts._sum.grandTotal);

  const monthBuckets = months.map((month) => {
    const total = monthOrders
      .filter((order) => monthKeyIstanbul(order.createdAt) === month.key)
      .reduce((sum, order) => sum + moneyNum(order.grandTotal), 0);
    return { key: month.key, label: month.label, total };
  });

  return (
    <div>
      <AdminHeading title="Ciro" subtitle="Sadece ödemesi alınan siparişler. Bekleyen ve iptaller ayrı durur." />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {REVENUE_PERIODS.map((item) => (
          <Link
            key={item.id}
            href={item.id === "month" ? "/admin/ciro" : `/admin/ciro?period=${item.id}`}
            className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${
              period === item.id ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-orange"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <RevenueCards
        totals={{
          collected,
          collectedCount,
          collectedNet: moneyNum(paidParts._sum.subtotal),
          collectedVat: moneyNum(paidParts._sum.vatTotal),
          pending: pendingTotal,
          pendingCount: pendingParts._count._all,
          lost: lostTotal,
          lostCount: lostParts._count._all,
          avgBasket: collectedCount > 0 ? collected / collectedCount : 0,
        }}
        channels={byPayment.map((row) => ({
          label: paymentLabel(row.provider),
          count: row._count._all,
          total: moneyNum(row._sum.amount),
        }))}
        months={monthBuckets}
        collected={paidOrders.map(toOrderRow)}
        pending={pendingOrders.map(toOrderRow)}
        lost={lostOrders.map(toOrderRow)}
      />
    </div>
  );
}
