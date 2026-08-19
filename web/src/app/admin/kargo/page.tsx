import { CargoPageView, type CargoKpi, type CargoRow } from "@/components/admin/CargoPageView";
import { cargoTabForStatus } from "@/lib/commerce/cargo";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kargo Yönetimi | Yönetim" };

export default async function AdminCargoPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const orders = await prisma.order.findMany({
    where: { status: { in: ["paid", "preparing", "shipped", "completed", "cancelled"] } },
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { user: { select: { name: true, email: true } } },
  });

  const rows: CargoRow[] = orders.map((order) => ({
    id: order.id,
    publicNumber: order.publicNumber,
    customer: order.user.name,
    email: order.user.email,
    source: "WEB",
    createdAt: order.createdAt.toISOString(),
    grandTotal: Number(order.grandTotal),
    status: order.status,
    tab: cargoTabForStatus(order.status) ?? "waiting",
    cargoCompany: order.cargoCompany,
    trackingNo: order.trackingNo,
    trackingUrl: order.trackingUrl,
    city: order.shipCity,
    district: order.shipDistrict,
    address: order.shipLine,
  }));

  const waiting = rows.filter((row) => row.tab === "waiting");
  const shippedMonth = rows.filter((row) => row.tab === "shipped" && new Date(row.createdAt) >= monthStart);
  const deliveredMonth = orders.filter((order) => order.status === "completed" && (order.deliveredAt ?? order.updatedAt) >= monthStart);
  const waitingSum = waiting.reduce((sum, row) => sum + row.grandTotal, 0);

  const kpis: CargoKpi[] = [
    { label: "Bugün Kargolanacak", value: waiting.length.toLocaleString("tr-TR"), hint: `₺${waitingSum.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: "bg-[#2f6bff]", icon: "today" },
    { label: "Kargolanan", value: shippedMonth.length.toLocaleString("tr-TR"), hint: "Bu ay", color: "bg-[#22c55e]", icon: "shipped" },
    { label: "Kargo Bekleyen", value: waiting.length.toLocaleString("tr-TR"), hint: "Takip no bekleniyor", color: "bg-[#f59e0b]", icon: "waiting" },
    { label: "Teslim Edilen", value: deliveredMonth.length.toLocaleString("tr-TR"), hint: "Bu ay", color: "bg-[#7c3aed]", icon: "delivered" },
  ];

  return <CargoPageView orders={rows} kpis={kpis} />;
}
