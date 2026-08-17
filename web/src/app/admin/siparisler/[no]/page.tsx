import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { formatPhoneTR } from "@/lib/phone";

export const metadata = { title: "Sipariş | Yönetim" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const { no } = await params;
  const order = await prisma.order.findUnique({
    where: { publicNumber: no },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          product: {
            select: { images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { localPath: true } } },
          },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  return (
    <div>
      <Link
        href="/admin/siparisler"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-bold text-navy hover:text-orange"
      >
        <ArrowLeft className="size-4" />
        Siparişlere dön
      </Link>
      <AdminHeading
        title={order.publicNumber}
        subtitle={`${formatDateTimeTr(order.createdAt)} · ${order.user.email}`}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-md border border-line bg-white p-5">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Ürünler</h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((item) => {
                const image = mediaUrl(item.product.images[0]?.localPath) ?? "/brand/logo.png";
                return (
                  <li key={item.id} className="flex items-start gap-3 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded border border-line bg-soft">
                      <Image src={image} alt="" fill unoptimized className="object-contain p-1" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-navy">{item.name}</p>
                      <p className="text-[12px] text-[#6b7280]">
                        {item.quantity.toLocaleString("tr-TR")} adet · SKU {item.sku}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                    </div>
                    <p className="font-extrabold">₺{formatPriceTry(item.lineTotal)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between">
                <dt>Ara toplam</dt>
                <dd>₺{formatPriceTry(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>KDV</dt>
                <dd>₺{formatPriceTry(order.vatTotal)}</dd>
              </div>
              <div className="flex justify-between font-extrabold text-navy">
                <dt>Toplam</dt>
                <dd>₺{formatPriceTry(order.grandTotal)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-line bg-white p-5">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Teslimat</h2>
            <p className="mt-3 text-[13px] font-semibold">{order.shipFullName}</p>
            <p className="text-[13px] text-[#555]">{formatPhoneTR(order.shipPhone) || order.shipPhone}</p>
            <p className="mt-1 text-[13px] text-[#555]">
              {order.shipLine}, {order.shipDistrict} / {order.shipCity}
            </p>
            {order.customerNote ? (
              <p className="mt-3 whitespace-pre-line rounded bg-soft p-3 text-[12px] text-[#555]">{order.customerNote}</p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border border-line bg-white p-5">
            <div className="mb-3">
              <StatusBadge status={order.status} />
            </div>
            <OrderStatusForm orderId={order.id} status={order.status} />
          </section>
          <section className="rounded-md border border-line bg-white p-5 text-[13px]">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Müşteri</h2>
            <p className="mt-3 font-semibold">{order.user.name}</p>
            <p className="text-[#555]">{order.user.email}</p>
            <Link href={`/admin/musteriler/${order.user.id}`} className="mt-3 inline-block font-bold text-navy hover:text-orange">
              Müşteri kartı
            </Link>
          </section>
          <section className="rounded-md border border-line bg-white p-5 text-[13px]">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Ödeme</h2>
            <p className="mt-3">
              {order.payments[0]
                ? `${order.payments[0].provider} · ${order.payments[0].status}`
                : "Kayıt yok"}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
