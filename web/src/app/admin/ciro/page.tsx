import Link from "next/link";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { OrderRow } from "@/components/admin/OrderRow";
import { RevenueCards, type RevenueOrderRow } from "@/components/admin/RevenueCards";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
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
import { formatPriceTry } from "@/lib/media";

export const metadata = { title: "Ciro | Yönetim" };

function tryMoney(n: number) {
  return `₺${formatPriceTry(n)}`;
}

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

  const [byStatus, byPayment, paidParts, monthOrders, paidOrders, pendingOrders, lostOrders] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      where: dateWhere,
      _sum: { grandTotal: true, subtotal: true, vatTotal: true, shippingTotal: true },
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ["status", "provider"],
      where: dateWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { ...dateWhere, status: { in: [...REVENUE_STATUSES] } },
      _sum: { grandTotal: true, subtotal: true, vatTotal: true, shippingTotal: true },
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

  const statusMap = Object.fromEntries(
    byStatus.map((row) => [
      row.status,
      {
        count: row._count._all,
        total: moneyNum(row._sum.grandTotal),
        subtotal: moneyNum(row._sum.subtotal),
        vat: moneyNum(row._sum.vatTotal),
        shipping: moneyNum(row._sum.shippingTotal),
      },
    ]),
  );

  const collected = moneyNum(paidParts._sum.grandTotal);
  const collectedCount = paidParts._count._all;
  const pendingTotal = PENDING_STATUSES.reduce((sum, status) => sum + (statusMap[status]?.total ?? 0), 0);
  const pendingCount = PENDING_STATUSES.reduce((sum, status) => sum + (statusMap[status]?.count ?? 0), 0);
  const lostTotal = LOST_STATUSES.reduce((sum, status) => sum + (statusMap[status]?.total ?? 0), 0);
  const avgBasket = collectedCount > 0 ? collected / collectedCount : 0;

  const monthBuckets = months.map((month) => {
    const total = monthOrders
      .filter((order) => monthKeyIstanbul(order.createdAt) === month.key)
      .reduce((sum, order) => sum + moneyNum(order.grandTotal), 0);
    return { ...month, total };
  });
  const maxMonth = Math.max(1, ...monthBuckets.map((row) => row.total));

  const cards = [
    { id: "collected" as const, label: "Tahsil edilen ciro", value: tryMoney(collected), hint: `${collectedCount} sipariş` },
    { id: "pending" as const, label: "Bekleyen tahsilat", value: tryMoney(pendingTotal), hint: `${pendingCount} sipariş` },
    { id: "lost" as const, label: "İptal / başarısız", value: tryMoney(lostTotal), hint: "Ciroya dahil değil" },
    { id: "exvat" as const, label: "KDV hariç", value: tryMoney(moneyNum(paidParts._sum.subtotal)), hint: "Tahsil edilen" },
    { id: "vat" as const, label: "KDV", value: tryMoney(moneyNum(paidParts._sum.vatTotal)), hint: "Tahsil edilen" },
    { id: "avg" as const, label: "Ortalama sepet", value: tryMoney(avgBasket), hint: "Tahsil edilen sipariş" },
  ];

  return (
    <div>
      <AdminHeading
        title="Ciro"
        subtitle="Tahsil edilen tutar; ödeme bekleyen siparişler ciroya dahil edilmez."
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {REVENUE_PERIODS.map((item) => (
          <Link
            key={item.id}
            href={item.id === "all" ? "/admin/ciro" : `/admin/ciro?period=${item.id}`}
            className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${
              period === item.id ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-orange"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <RevenueCards
        cards={cards}
        collected={paidOrders.map(toOrderRow)}
        pending={pendingOrders.map(toOrderRow)}
        lost={lostOrders.map(toOrderRow)}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border border-line bg-white">
          <h2 className="border-b border-line px-4 py-3 text-[14px] font-extrabold tracking-wide text-[#111] uppercase">
            Sipariş durumuna göre
          </h2>
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              <tr>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2">Adet</th>
                <th className="px-4 py-2">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {byStatus.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-[#6b7280]">
                    Bu dönemde sipariş yok.
                  </td>
                </tr>
              ) : (
                byStatus
                  .slice()
                  .sort((a, b) => moneyNum(b._sum.grandTotal) - moneyNum(a._sum.grandTotal))
                  .map((row) => (
                    <tr key={row.status} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-2.5">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-2.5">{row._count._all}</td>
                      <td className="px-4 py-2.5 font-extrabold">{tryMoney(moneyNum(row._sum.grandTotal))}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-md border border-line bg-white">
          <h2 className="border-b border-line px-4 py-3 text-[14px] font-extrabold tracking-wide text-[#111] uppercase">
            Ödeme kırılımı
          </h2>
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              <tr>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2">Kanal</th>
                <th className="px-4 py-2">Adet</th>
                <th className="px-4 py-2">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {byPayment.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-[#6b7280]">
                    Bu dönemde ödeme kaydı yok.
                  </td>
                </tr>
              ) : (
                byPayment.map((row) => (
                  <tr key={`${row.status}-${row.provider}`} className="border-b border-line last:border-b-0">
                    <td className="px-4 py-2.5">
                      <StatusBadge status={row.status} kind="payment" />
                    </td>
                    <td className="px-4 py-2.5">
                      {row.provider === "iyzico" ? "Kredi kartı" : row.provider === "transfer" ? "Havale / EFT" : row.provider}
                    </td>
                    <td className="px-4 py-2.5">{row._count._all}</td>
                    <td className="px-4 py-2.5 font-extrabold">{tryMoney(moneyNum(row._sum.amount))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="mt-4 rounded-md border border-line bg-white p-4">
        <h2 className="text-[14px] font-extrabold tracking-wide text-[#111] uppercase">Son 6 ay tahsil edilen ciro</h2>
        <ul className="mt-4 space-y-2.5">
          {monthBuckets.map((row) => (
            <li key={row.key} className="grid grid-cols-[140px_minmax(0,1fr)_auto] items-center gap-3 text-[13px]">
              <span className="capitalize text-[#555]">{row.label}</span>
              <span className="h-2 overflow-hidden rounded bg-soft">
                <span
                  className="block h-full rounded bg-navy"
                  style={{ width: `${Math.max(row.total > 0 ? 6 : 0, (row.total / maxMonth) * 100)}%` }}
                />
              </span>
              <span className="font-extrabold text-navy">{tryMoney(row.total)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-md border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[14px] font-extrabold tracking-wide text-[#111] uppercase">Ciroya giren siparişler</h2>
          <Link href="/admin/siparisler" className="text-[12px] font-bold text-navy hover:text-orange">
            Tümü
          </Link>
        </div>
        {paidOrders.length === 0 ? (
          <p className="p-4 text-[13px] text-[#6b7280]">Bu dönemde tahsil edilmiş sipariş yok.</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              <tr>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Müşteri</th>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2">Tutar</th>
                <th className="px-4 py-2">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {paidOrders.map((order) => (
                <OrderRow key={order.id} href={`/admin/siparisler/${order.publicNumber}`}>
                  <td className="px-4 py-2.5 font-extrabold text-navy">{order.publicNumber}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold">{order.user.name}</p>
                    <p className="text-[12px] text-[#6b7280]">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-2.5 font-extrabold">{tryMoney(moneyNum(order.grandTotal))}</td>
                  <td className="px-4 py-2.5 text-[#6b7280]">{formatDateTimeTr(order.createdAt)}</td>
                </OrderRow>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-4 rounded-md border border-line bg-white">
        <h2 className="border-b border-line px-4 py-3 text-[14px] font-extrabold tracking-wide text-[#111] uppercase">
          Bekleyen tahsilat
        </h2>
        {pendingOrders.length === 0 ? (
          <p className="p-4 text-[13px] text-[#6b7280]">Bekleyen ödeme yok.</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              <tr>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Müşteri</th>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2">Tutar</th>
                <th className="px-4 py-2">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.map((order) => (
                <OrderRow key={order.id} href={`/admin/siparisler/${order.publicNumber}`}>
                  <td className="px-4 py-2.5 font-extrabold text-navy">{order.publicNumber}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold">{order.user.name}</p>
                    <p className="text-[12px] text-[#6b7280]">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-2.5 font-extrabold">{tryMoney(moneyNum(order.grandTotal))}</td>
                  <td className="px-4 py-2.5 text-[#6b7280]">{formatDateTimeTr(order.createdAt)}</td>
                </OrderRow>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
