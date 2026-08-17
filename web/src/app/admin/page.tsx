import Link from "next/link";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { OrderRow } from "@/components/admin/OrderRow";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { formatPriceTry } from "@/lib/media";
import { REVENUE_STATUSES } from "@/lib/commerce/revenue";
import { cartMoneySummary, countActiveCarts } from "@/lib/commerce/cart";

export const metadata = { title: "Yönetim özeti" };

export default async function AdminHomePage() {
  const [orderCount, revenue, pending, userCount, productCount, cartCount, recent, carts] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { in: [...REVENUE_STATUSES] } },
      _sum: { grandTotal: true },
    }),
    prisma.order.count({ where: { status: "pending_payment" } }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.product.count({ where: { isActive: true } }),
    countActiveCarts(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.cart.findMany({
      where: { items: { some: {} } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: { product: { select: { name: true, price: true, vatRate: true } } },
        },
      },
    }),
  ]);

  const cards = [
    { label: "Sipariş", value: orderCount.toLocaleString("tr-TR"), href: "/admin/siparisler" },
    { label: "Aktif sepet", value: cartCount.toLocaleString("tr-TR"), href: "/admin/sepetler" },
    { label: "Ciro", value: `₺${formatPriceTry(Number(revenue._sum.grandTotal ?? 0))}`, href: "/admin/ciro" },
    { label: "Ödeme bekleyen", value: pending.toLocaleString("tr-TR"), href: "/admin/siparisler" },
    { label: "Müşteri", value: userCount.toLocaleString("tr-TR"), href: "/admin/musteriler" },
    { label: "Aktif ürün", value: productCount.toLocaleString("tr-TR"), href: "/admin/urunler" },
  ];

  return (
    <div>
      <AdminHeading title="Özet" subtitle="Sipariş, müşteri ve katalog durumu." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-md border border-line bg-white p-4 hover:border-orange"
          >
            <p className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">{card.label}</p>
            <p className="mt-2 text-[20px] font-extrabold text-navy">{card.value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-md border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[14px] font-extrabold tracking-wide text-[#111] uppercase">Aktif sepetler</h2>
          <Link href="/admin/sepetler" className="text-[12px] font-bold text-navy hover:text-orange">
            Tümü
          </Link>
        </div>
        {carts.length === 0 ? (
          <p className="p-4 text-[13px] text-[#6b7280]">Dolu sepet yok. Ürün eklenince burada görünür.</p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              <tr>
                <th className="px-4 py-2">Müşteri</th>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2">Adet</th>
                <th className="px-4 py-2">Tutar</th>
                <th className="px-4 py-2">Güncelleme</th>
              </tr>
            </thead>
            <tbody>
              {carts.map((cart) => {
                const summary = cartMoneySummary(cart.items);
                return (
                  <OrderRow key={cart.id} href={`/admin/sepetler/${cart.id}`}>
                    <td className="px-4 py-2.5">
                      {cart.user ? (
                        <>
                          <p className="font-semibold">{cart.user.name}</p>
                          <p className="text-[12px] text-[#6b7280]">{cart.user.email}</p>
                        </>
                      ) : (
                        <p className="font-semibold">Misafir</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[#444]">
                      {summary.preview || "—"}
                      {summary.lines > 2 ? ` +${summary.lines - 2}` : ""}
                    </td>
                    <td className="px-4 py-2.5">{summary.quantity}</td>
                    <td className="px-4 py-2.5 font-extrabold">₺{formatPriceTry(summary.grand)}</td>
                    <td className="px-4 py-2.5 text-[#6b7280]">{formatDateTimeTr(cart.updatedAt)}</td>
                  </OrderRow>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-8 rounded-md border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-[14px] font-extrabold tracking-wide text-[#111] uppercase">Son siparişler</h2>
          <Link href="/admin/siparisler" className="text-[12px] font-bold text-navy hover:text-orange">
            Tümü
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-4 text-[13px] text-[#6b7280]">Henüz sipariş yok.</p>
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
              {recent.map((order) => (
                <OrderRow key={order.id} href={`/admin/siparisler/${order.publicNumber}`}>
                  <td className="px-4 py-2.5 font-extrabold text-navy">{order.publicNumber}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold">{order.user.name}</p>
                    <p className="text-[12px] text-[#6b7280]">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-2.5 font-extrabold">₺{formatPriceTry(order.grandTotal)}</td>
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
