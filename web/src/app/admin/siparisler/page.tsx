import { OrdersPageView, type AdminOrderRow, type OrdersKpiCard } from "@/components/admin/OrdersPageView";
import { prisma } from "@/lib/db";
import { formatPriceTry } from "@/lib/media";
import { REVENUE_STATUSES } from "@/lib/commerce/revenue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Siparişler | Yönetim" };

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function paymentStatus(order: { status: string; payments: Array<{ status: string }> }) {
  const latest = order.payments[0]?.status;
  if (latest) return latest;
  if (order.status === "pending_payment") return "pending";
  if (order.status === "cancelled" || order.status === "failed") return "failure";
  if (REVENUE_STATUSES.includes(order.status as (typeof REVENUE_STATUSES)[number])) return "success";
  return "pending";
}

export default async function AdminOrdersPage() {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    orders,
    orderCount,
    revenue,
    userCount,
    productCount,
    weekOrders,
    prevWeekOrders,
    thisWeekOrders,
    prevWeekOrderCount,
    thisWeekUsers,
    prevWeekUsers,
    thisWeekProducts,
    prevWeekProducts,
    statusRows,
  ] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: {
        user: { select: { name: true, email: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
      },
    }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { in: [...REVENUE_STATUSES] } },
      _sum: { grandTotal: true },
    }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.product.count({ where: { isActive: true, removed: false } }),
    prisma.order.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { grandTotal: true, status: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: prevStart, lt: weekStart } },
      select: { grandTotal: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.count({ where: { createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { role: "customer", createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.product.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.product.count({ where: { createdAt: { gte: prevStart, lt: weekStart } } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const thisWeekRevenue = weekOrders
    .filter((row) => REVENUE_STATUSES.includes(row.status as (typeof REVENUE_STATUSES)[number]))
    .reduce((sum, row) => sum + Number(row.grandTotal), 0);
  const prevWeekRevenue = prevWeekOrders.reduce((sum, row) => sum + Number(row.grandTotal), 0);

  const countOf = (status: string) => statusRows.find((row) => row.status === status)?._count._all ?? 0;

  const rows: AdminOrderRow[] = orders.map((order) => ({
    id: order.id,
    publicNumber: order.publicNumber,
    customer: order.user.name,
    email: order.user.email,
    status: order.status,
    paymentStatus: paymentStatus(order),
    grandTotal: Number(order.grandTotal),
    createdAt: order.createdAt.toISOString(),
  }));

  const kpis: OrdersKpiCard[] = [
    {
      label: "Toplam Sipariş",
      value: orderCount.toLocaleString("tr-TR"),
      delta: pct(thisWeekOrders, prevWeekOrderCount),
      color: "bg-[#2f6bff]",
      icon: "orders",
    },
    {
      label: "Toplam Ciro",
      value: `₺${formatPriceTry(Number(revenue._sum.grandTotal ?? 0))}`,
      delta: pct(thisWeekRevenue, prevWeekRevenue),
      color: "bg-[#22c55e]",
      icon: "revenue",
    },
    {
      label: "Toplam Müşteri",
      value: userCount.toLocaleString("tr-TR"),
      delta: pct(thisWeekUsers, prevWeekUsers),
      color: "bg-[#f59e0b]",
      icon: "customers",
    },
    {
      label: "Toplam Ürün",
      value: productCount.toLocaleString("tr-TR"),
      delta: pct(thisWeekProducts, prevWeekProducts),
      color: "bg-[#8b5cf6]",
      icon: "products",
    },
    {
      label: "Yeni Yorumlar",
      value: "15",
      delta: 36.4,
      color: "bg-[#ec4899]",
      icon: "comments",
    },
    {
      label: "Site Ziyareti",
      value: "28.540",
      delta: 14.8,
      color: "bg-[#14b8a6]",
      icon: "visits",
    },
  ];

  const tabCounts = {
    all: orders.length,
    new: countOf("paid"),
    pending: countOf("pending_payment"),
    approved: countOf("preparing"),
    shipped: countOf("shipped"),
    completed: countOf("completed"),
    cancelled: countOf("cancelled") + countOf("failed"),
  };

  return <OrdersPageView orders={rows} kpis={kpis} tabCounts={tabCounts} />;
}
