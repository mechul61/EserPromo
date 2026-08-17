import Link from "next/link";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { AdminPager, AdminSearch } from "@/components/admin/AdminSearch";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { formatPriceTry } from "@/lib/media";

export const metadata = { title: "Siparişler | Yönetim" };

const PAGE_SIZE = 20;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: rawPage } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(rawPage) || 1);
  const where = query
    ? {
        OR: [
          { publicNumber: { contains: query, mode: "insensitive" as const } },
          { shipFullName: { contains: query, mode: "insensitive" as const } },
          { user: { email: { contains: query, mode: "insensitive" as const } } },
          { user: { name: { contains: query, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } }, _count: { select: { items: true } } },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminHeading title="Siparişler" subtitle={`${total.toLocaleString("tr-TR")} sipariş`} />
      <div className="mb-4 max-w-xl">
        <AdminSearch action="/admin/siparisler" placeholder="Sipariş no, müşteri veya e-posta" q={query} />
      </div>
      <div className="overflow-x-auto rounded-md border border-line bg-white">
        {orders.length === 0 ? (
          <p className="p-5 text-[13px] text-[#6b7280]">Sipariş bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              <tr>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">Müşteri</th>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2">Tutar</th>
                <th className="px-4 py-2">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
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
                  <td className="px-4 py-2.5">{order._count.items}</td>
                  <td className="px-4 py-2.5 font-extrabold">₺{formatPriceTry(order.grandTotal)}</td>
                  <td className="px-4 py-2.5 text-[#6b7280]">{formatDateTimeTr(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AdminPager href="/admin/siparisler" page={page} pageCount={pageCount} q={query} />
    </div>
  );
}
