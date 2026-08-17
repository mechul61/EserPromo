import { AdminHeading } from "@/components/admin/AdminChrome";
import { AdminPager, AdminSearch } from "@/components/admin/AdminSearch";
import { OrderRow } from "@/components/admin/OrderRow";
import { prisma } from "@/lib/db";
import { formatDateTr } from "@/lib/account";

export const metadata = { title: "Müşteriler | Yönetim" };

const PAGE_SIZE = 20;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: rawPage } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(rawPage) || 1);
  const where = {
    role: "customer" as const,
    ...(query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { orders: true } } },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminHeading title="Müşteriler" subtitle={`${total.toLocaleString("tr-TR")} üye`} />
      <div className="mb-4 max-w-xl">
        <AdminSearch action="/admin/musteriler" placeholder="Ad, e-posta veya telefon" q={query} />
      </div>
      <div className="overflow-x-auto rounded-md border border-line bg-white">
        {users.length === 0 ? (
          <p className="p-5 text-[13px] text-[#6b7280]">Müşteri bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              <tr>
                <th className="px-4 py-2">Ad</th>
                <th className="px-4 py-2">E-posta</th>
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2">Sipariş</th>
                <th className="px-4 py-2">Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <OrderRow key={user.id} href={`/admin/musteriler/${user.id}`}>
                  <td className="px-4 py-2.5 font-extrabold text-navy">
                    {user.name}
                    {!user.isActive ? (
                      <span className="ml-2 text-[11px] font-bold text-brand-red">Pasif</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">{user.email}</td>
                  <td className="px-4 py-2.5">{user.role === "admin" ? "Yönetici" : "Müşteri"}</td>
                  <td className="px-4 py-2.5">{user._count.orders}</td>
                  <td className="px-4 py-2.5 text-[#6b7280]">{formatDateTr(user.createdAt)}</td>
                </OrderRow>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AdminPager href="/admin/musteriler" page={page} pageCount={pageCount} q={query} />
    </div>
  );
}
