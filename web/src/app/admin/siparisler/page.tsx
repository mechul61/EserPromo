import { AdminHeading } from "@/components/admin/AdminChrome";
import { AdminPager, AdminSearch } from "@/components/admin/AdminSearch";
import { OrderRow } from "@/components/admin/OrderRow";
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
      include: {
        user: { select: { name: true, email: true } },
        items: {
          take: 3,
          select: {
            id: true,
            name: true,
            quantity: true,
            sku: true,
            product: { select: { slug: true } },
          },
        },
        _count: { select: { items: true } },
      },
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
                <OrderRow key={order.id} href={`/admin/siparisler/${order.publicNumber}`}>
                  <td className="px-4 py-2.5 font-extrabold text-navy">{order.publicNumber}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold">{order.user.name}</p>
                    <p className="text-[12px] text-[#6b7280]">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="max-w-[280px] space-y-0.5">
                      {order.items.map((item) => (
                        <p key={item.id} className="font-semibold text-[#111]">
                          {item.name}
                          <span className="ml-1 font-medium text-[#6b7280]">
                            · {item.quantity.toLocaleString("tr-TR")} adet
                          </span>
                        </p>
                      ))}
                      {order._count.items > order.items.length ? (
                        <p className="text-[12px] font-bold text-[#6b7280]">
                          +{order._count.items - order.items.length} ürün daha
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-extrabold">₺{formatPriceTry(order.grandTotal)}</td>
                  <td className="px-4 py-2.5 text-[#6b7280]">{formatDateTimeTr(order.createdAt)}</td>
                </OrderRow>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AdminPager href="/admin/siparisler" page={page} pageCount={pageCount} q={query} />
    </div>
  );
}
