import { CustomersPageView } from "@/components/admin/CustomersPageView";
import type {
  CustomerKpi,
  CustomerRow,
  CustomerShare,
  CustomerSourceShare,
  CustomerStatus,
  TopSpender,
} from "@/components/admin/customer-types";
import { prisma } from "@/lib/db";
import { REVENUE_STATUSES } from "@/lib/commerce/revenue";
import { formatPriceTry } from "@/lib/media";
import { formatPhoneTR } from "@/lib/phone";

export const dynamic = "force-dynamic";
export const metadata = { title: "Müşteriler | Yönetim" };

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  return letters || "M";
}

function statusOf(isActive: boolean, blocked: boolean): CustomerStatus {
  if (blocked) return "blocked";
  if (!isActive) return "passive";
  return "active";
}

export default async function AdminCustomersPage() {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const customersWhere = { role: "customer" as const };

  const [users, spendRows, weekUsers, prevWeekUsers, weekActive, prevWeekActive, weekOrders, prevWeekOrders, weekSpend, prevWeekSpend] =
    await Promise.all([
      prisma.user.findMany({
        where: customersWhere,
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: {
          _count: { select: { orders: true } },
          addresses: { select: { city: true, isDefault: true }, orderBy: { isDefault: "desc" }, take: 1 },
        },
      }),
      prisma.order.groupBy({
        by: ["userId"],
        where: { status: { in: [...REVENUE_STATUSES] }, user: customersWhere },
        _sum: { grandTotal: true },
        _count: true,
      }),
      prisma.user.count({ where: { ...customersWhere, createdAt: { gte: weekStart } } }),
      prisma.user.count({ where: { ...customersWhere, createdAt: { gte: prevStart, lt: weekStart } } }),
      prisma.user.count({ where: { ...customersWhere, isActive: true, blocked: false, createdAt: { gte: weekStart } } }),
      prisma.user.count({
        where: { ...customersWhere, isActive: true, blocked: false, createdAt: { gte: prevStart, lt: weekStart } },
      }),
      prisma.order.count({ where: { createdAt: { gte: weekStart }, user: customersWhere } }),
      prisma.order.count({ where: { createdAt: { gte: prevStart, lt: weekStart }, user: customersWhere } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: weekStart }, status: { in: [...REVENUE_STATUSES] }, user: customersWhere },
        _sum: { grandTotal: true },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: prevStart, lt: weekStart },
          status: { in: [...REVENUE_STATUSES] },
          user: customersWhere,
        },
        _sum: { grandTotal: true },
      }),
    ]);

  const spendByUser = new Map(spendRows.map((row) => [row.userId, Number(row._sum.grandTotal ?? 0)]));
  const rows: CustomerRow[] = users.map((user) => {
    const city = user.city || user.addresses[0]?.city || "";
    return {
      id: user.id,
      publicNo: user.publicNo,
      name: user.name,
      email: user.email,
      phone: formatPhoneTR(user.phone ?? "") || "—",
      city,
      customerGroup: user.customerGroup,
      source: user.source,
      isActive: user.isActive,
      blocked: user.blocked,
      status: statusOf(user.isActive, user.blocked),
      orderCount: user._count.orders,
      spend: spendByUser.get(user.id) ?? 0,
      createdAt: user.createdAt.toISOString(),
      isNew: user.createdAt >= weekStart,
    };
  });

  const active = rows.filter((row) => row.status === "active").length;
  const totalSpend = rows.reduce((sum, row) => sum + row.spend, 0);
  const totalOrders = rows.reduce((sum, row) => sum + row.orderCount, 0);

  const kpis: CustomerKpi[] = [
    { label: "Toplam Müşteri", value: rows.length.toLocaleString("tr-TR"), delta: pct(weekUsers, prevWeekUsers), color: "bg-[#2f6bff]", icon: "total" },
    { label: "Aktif Müşteri", value: active.toLocaleString("tr-TR"), delta: pct(weekActive, prevWeekActive), color: "bg-[#22c55e]", icon: "active" },
    { label: "Yeni Müşteri", value: weekUsers.toLocaleString("tr-TR"), delta: pct(weekUsers, prevWeekUsers), color: "bg-[#f59e0b]", icon: "new" },
    { label: "Toplam Sipariş", value: totalOrders.toLocaleString("tr-TR"), delta: pct(weekOrders, prevWeekOrders), color: "bg-[#7c3aed]", icon: "orders" },
    {
      label: "Toplam Harcama",
      value: `₺${formatPriceTry(totalSpend)}`,
      delta: pct(Number(weekSpend._sum.grandTotal ?? 0), Number(prevWeekSpend._sum.grandTotal ?? 0)),
      color: "bg-[#ec4899]",
      icon: "spend",
    },
  ];

  const passive = rows.filter((row) => row.status !== "active").length;
  const distCounts = [
    { id: "retail", name: "Perakende", count: rows.filter((row) => row.status === "active" && row.customerGroup === "retail").length, color: "#2f6bff" },
    { id: "wholesale", name: "Toptan", count: rows.filter((row) => row.status === "active" && row.customerGroup === "wholesale").length, color: "#f59e0b" },
    { id: "vip", name: "VIP", count: rows.filter((row) => row.status === "active" && row.customerGroup === "vip").length, color: "#8b5cf6" },
    { id: "passive", name: "Pasif", count: passive, color: "#94a3b8" },
  ];
  const distTotal = Math.max(1, distCounts.reduce((sum, item) => sum + item.count, 0));
  const shares: CustomerShare[] = distCounts.map((item) => ({
    ...item,
    percent: Math.round((item.count / distTotal) * 100),
  }));

  const sourceTotal = Math.max(1, rows.length);
  const sources: CustomerSourceShare[] = [
    { id: "website", name: "Web Sitesi", percent: 0 },
    { id: "social", name: "Sosyal Medya", percent: 0 },
    { id: "email", name: "E-posta Kampanyası", percent: 0 },
    { id: "other", name: "Diğer", percent: 0 },
  ].map((item) => ({
    ...item,
    percent: Math.round((rows.filter((row) => row.source === item.id).length / sourceTotal) * 100),
  }));

  const topSpenders: TopSpender[] = [...rows]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5)
    .map((row) => ({ id: row.id, name: row.name, initials: initials(row.name), spend: row.spend }));

  const cities = [...new Set(rows.map((row) => row.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, "tr"));

  return <CustomersPageView customers={rows} kpis={kpis} shares={shares} sources={sources} topSpenders={topSpenders} cities={cities} />;
}
