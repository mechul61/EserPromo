import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { formatPriceTry } from "@/lib/media";
import { formatPhoneTR } from "@/lib/phone";
import { cartMoneySummary } from "@/lib/commerce/cart";

export const metadata = { title: "Müşteri | Yönetim" };

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
      addresses: { orderBy: { createdAt: "desc" } },
      carts: {
        include: {
          items: {
            include: { product: { select: { name: true, price: true, vatRate: true } } },
          },
        },
        take: 1,
      },
      _count: { select: { orders: true, favorites: true } },
    },
  });
  if (!user) notFound();
  const cart = user.carts[0] ?? null;

  return (
    <div>
      <Link
        href="/admin/musteriler"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-bold text-navy hover:text-orange"
      >
        <ArrowLeft className="size-4" />
        Müşterilere dön
      </Link>
      <AdminHeading title={user.name} subtitle={user.email} />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className="rounded-md border border-line bg-white p-5 text-[13px]">
          <p>
            <span className="text-[#6b7280]">Müşteri no: </span>
            #{user.publicNo}
          </p>
          <p className="mt-2">
            <span className="text-[#6b7280]">Telefon: </span>
            {formatPhoneTR(user.phone ?? "") || "—"}
          </p>
          <p className="mt-2">
            <span className="text-[#6b7280]">Grup: </span>
            {user.customerGroup === "vip" ? "VIP" : user.customerGroup === "wholesale" ? "Toptan" : "Perakende"}
          </p>
          <p className="mt-2">
            <span className="text-[#6b7280]">Rol: </span>
            {user.role === "customer" ? "Müşteri" : "Yönetici"}
          </p>
          <p className="mt-2">
            <span className="text-[#6b7280]">Kayıt: </span>
            {formatDateTimeTr(user.createdAt)}
          </p>
          <p className="mt-2">
            <span className="text-[#6b7280]">Sipariş / favori: </span>
            {user._count.orders} / {user._count.favorites}
          </p>
          <div className="mt-4">
            <ActiveToggle href={`/api/admin/users/${user.id}`} active={user.isActive} />
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-md border border-line bg-white p-5">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Sepet</h2>
            {!cart || cart.items.length === 0 ? (
              <p className="mt-3 text-[13px] text-[#6b7280]">Sepet boş.</p>
            ) : (
              <div className="mt-3 text-[13px]">
                <ul className="divide-y divide-line">
                  {cart.items.map((item) => {
                    const line = cartMoneySummary([item]);
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span>
                          {item.product.name}{" "}
                          <span className="text-[#6b7280]">×{item.quantity}</span>
                        </span>
                        <span className="font-extrabold">₺{formatPriceTry(line.grand)}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-right font-extrabold text-navy">
                  Toplam ₺{formatPriceTry(cartMoneySummary(cart.items).grand)}
                </p>
                <Link
                  href={`/admin/sepetler/${cart.id}`}
                  className="mt-2 inline-block text-[12px] font-bold text-navy hover:text-orange"
                >
                  Sepet detayı
                </Link>
              </div>
            )}
          </section>
          <section className="rounded-md border border-line bg-white p-5">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Siparişler</h2>
            {user.orders.length === 0 ? (
              <p className="mt-3 text-[13px] text-[#6b7280]">Sipariş yok.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line text-[13px]">
                {user.orders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <Link href={`/admin/siparisler/${order.publicNumber}`} className="font-extrabold text-navy hover:text-orange">
                        {order.publicNumber}
                      </Link>
                      <p className="text-[12px] text-[#6b7280]">{formatDateTimeTr(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={order.status} />
                      <p className="mt-1 font-extrabold">₺{formatPriceTry(order.grandTotal)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="rounded-md border border-line bg-white p-5">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Adresler</h2>
            {user.addresses.length === 0 ? (
              <p className="mt-3 text-[13px] text-[#6b7280]">Kayıtlı adres yok.</p>
            ) : (
              <ul className="mt-3 space-y-3 text-[13px]">
                {user.addresses.map((address) => (
                  <li key={address.id} className="rounded border border-line p-3">
                    <p className="font-extrabold">{address.title}</p>
                    <p>{address.fullName}</p>
                    <p className="text-[#555]">
                      {address.line}, {address.district} / {address.city}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
