import Link from "next/link";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { formatPriceTry } from "@/lib/media";

export const metadata = { title: "Yönetim özeti" };

export default async function AdminHomePage() {
  const paidStatuses = ["paid", "preparing", "shipped", "completed"] as const;
  const [orderCount, revenue, pending, userCount, productCount, recent] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { in: [...paidStatuses] } },
      _sum: { grandTotal: true },
    }),
    prisma.order.count({ where: { status: "pending_payment" } }),
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const cards = [
    { label: "Sipariş", value: orderCount.toLocaleString("tr-TR"), href: "/admin/siparisler" },
    { label: "Ciro", value: `₺${formatPriceTry(Number(revenue._sum.grandTotal ?? 0))}`, href: "/admin/siparisler" },
    { label: "Ödeme bekleyen", value: pending.toLocaleString("tr-TR"), href: "/admin/siparisler" },
    { label: "Müşteri", value: userCount.toLocaleString("tr-TR"), href: "/admin/musteriler" },
    { label: "Aktif ürün", value: productCount.toLocaleString("tr-TR"), href: "/admin/urunler" },
  ];

  return (
    <div>
      <AdminHeading title="Özet" subtitle="Sipariş, müşteri ve katalog durumu." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
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
                <tr key={order.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/siparisler/${order.publicNumber}`} className="font-extrabold text-navy hover:text-orange">
                      {order.publicNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold">{order.user.name}</p>
                    <p className="text-[12px] text-[#6b7280]">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-2.5 font-extrabold">₺{formatPriceTry(order.grandTotal)}</td>
                  <td className="px-4 py-2.5 text-[#6b7280]">{formatDateTimeTr(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
