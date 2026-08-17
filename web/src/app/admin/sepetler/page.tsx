import Link from "next/link";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { AdminPager, AdminSearch } from "@/components/admin/AdminSearch";
import { OrderRow } from "@/components/admin/OrderRow";
import { cartMoneySummary } from "@/lib/commerce/cart";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { formatPriceTry } from "@/lib/media";

export const metadata = { title: "Sepetler | Yönetim" };

const PAGE_SIZE = 20;

export default async function AdminCartsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: rawPage } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(rawPage) || 1);
  const search = query
    ? {
        OR: [
          { user: { name: { contains: query, mode: "insensitive" as const } } },
          { user: { email: { contains: query, mode: "insensitive" as const } } },
          { items: { some: { product: { name: { contains: query, mode: "insensitive" as const } } } } },
        ],
      }
    : {};

  const where = { items: { some: {} }, ...search };

  const [total, carts] = await Promise.all([
    prisma.cart.count({ where }),
    prisma.cart.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true, price: true, vatRate: true } },
          },
        },
      },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminHeading
        title="Aktif sepetler"
        subtitle={`${total.toLocaleString("tr-TR")} dolu sepet · siparişe dönüşmemiş ürünler`}
      />
      <div className="mb-4 max-w-xl">
        <AdminSearch action="/admin/sepetler" placeholder="Müşteri, e-posta veya ürün" q={query} />
      </div>
      <div className="overflow-x-auto rounded-md border border-line bg-white">
        {carts.length === 0 ? (
          <p className="p-5 text-[13px] text-[#6b7280]">Dolu sepet yok.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-[13px]">
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
                          <p className="font-extrabold text-navy">{cart.user.name}</p>
                          <p className="text-[12px] text-[#6b7280]">{cart.user.email}</p>
                        </>
                      ) : (
                        <p className="font-extrabold text-navy">Misafir</p>
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
      </div>
      <AdminPager href="/admin/sepetler" page={page} pageCount={pageCount} q={query} />
    </div>
  );
}
