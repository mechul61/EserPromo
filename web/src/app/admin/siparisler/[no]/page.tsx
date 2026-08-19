import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { OrderDeleteButton } from "@/components/admin/OrderDeleteButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { formatPhoneTR } from "@/lib/phone";
import { CARGO_COMPANIES, isCargoCompany } from "@/lib/commerce/cargo";
import { productPath } from "@/lib/seo/urls";

export const metadata = { title: "Sipariş | Yönetim" };

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">{label}</dt>
      <dd className="text-[13px] font-semibold break-words text-[#111]">{value}</dd>
    </div>
  );
}

function parseNote(note: string | null) {
  if (!note?.trim()) return { rows: [] as Array<{ label: string; value: string }>, extra: "" };
  const rows: Array<{ label: string; value: string }> = [];
  const extra: string[] = [];
  for (const line of note.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx > 0 && idx < 48) {
      rows.push({ label: trimmed.slice(0, idx).trim(), value: trimmed.slice(idx + 1).trim() });
    } else {
      extra.push(trimmed);
    }
  }
  return { rows, extra: extra.join("\n") };
}

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
            select: {
              id: true,
              slug: true,
              size: true,
              stockTotal: true,
              title: true,
              category: { select: { name: true } },
              images: { orderBy: { sortOrder: "asc" as const }, take: 1, select: { localPath: true } },
            },
          },
        },
      },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const payment = order.payments[0];
  const note = parseNote(order.customerNote);

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

      <div className="mb-4 flex justify-end">
        <OrderDeleteButton
          orderId={order.id}
          publicNumber={order.publicNumber}
          orderStatus={order.status}
          paymentStatus={payment?.status}
          redirectToList
        />
      </div>

      <section className="mb-4 rounded-md border border-line bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          {payment ? <StatusBadge status={payment.status} kind="payment" /> : null}
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">Sipariş tarihi</dt>
            <dd className="mt-0.5 font-semibold">{formatDateTimeTr(order.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">Son güncelleme</dt>
            <dd className="mt-0.5 font-semibold">{formatDateTimeTr(order.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">Ödeme tarihi</dt>
            <dd className="mt-0.5 font-semibold">{order.paidAt ? formatDateTimeTr(order.paidAt) : "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">Tutar</dt>
            <dd className="mt-0.5 font-extrabold text-navy">
              ₺{formatPriceTry(order.grandTotal)} {order.currency}
            </dd>
          </div>
        </dl>
        <div className="mt-4 border-t border-line pt-4">
          <OrderStatusForm
            orderId={order.id}
            status={order.status}
            paymentStatus={payment?.status}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className="rounded-md border border-line bg-white p-5">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Ürünler</h2>
            <ul className="mt-3 divide-y divide-line">
              {order.items.map((item) => {
                const image = mediaUrl(item.product.images[0]?.localPath) ?? "/brand/logo.png";
                const unitGross = Number(item.unitPrice) * (1 + Number(item.vatRate) / 100);
                return (
                  <li key={item.id} className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded border border-line bg-soft">
                        <Image src={image} alt="" fill unoptimized className="object-contain p-1" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-navy">{item.product.title || item.name}</p>
                        <dl className="mt-2 grid gap-x-6 gap-y-1 text-[12px] sm:grid-cols-2">
                          <div>
                            <dt className="text-[#6b7280]">SKU</dt>
                            <dd className="font-semibold">{item.sku}</dd>
                          </div>
                          <div>
                            <dt className="text-[#6b7280]">Ürün ID</dt>
                            <dd className="font-semibold">{item.productId}</dd>
                          </div>
                          {item.color ? (
                            <div>
                              <dt className="text-[#6b7280]">Renk</dt>
                              <dd className="font-semibold">{item.color}</dd>
                            </div>
                          ) : null}
                          {item.product.size ? (
                            <div>
                              <dt className="text-[#6b7280]">Ebat</dt>
                              <dd className="font-semibold">{item.product.size}</dd>
                            </div>
                          ) : null}
                          <div>
                            <dt className="text-[#6b7280]">Adet</dt>
                            <dd className="font-semibold">{item.quantity.toLocaleString("tr-TR")}</dd>
                          </div>
                          <div>
                            <dt className="text-[#6b7280]">Kategori</dt>
                            <dd className="font-semibold">{item.product.category.name}</dd>
                          </div>
                          <div>
                            <dt className="text-[#6b7280]">Birim (KDV hariç)</dt>
                            <dd className="font-semibold">₺{formatPriceTry(item.unitPrice)}</dd>
                          </div>
                          <div>
                            <dt className="text-[#6b7280]">Birim (KDV dahil)</dt>
                            <dd className="font-semibold">₺{formatPriceTry(unitGross)}</dd>
                          </div>
                          <div>
                            <dt className="text-[#6b7280]">KDV oranı</dt>
                            <dd className="font-semibold">%{Number(item.vatRate).toLocaleString("tr-TR")}</dd>
                          </div>
                          <div>
                            <dt className="text-[#6b7280]">Güncel stok</dt>
                            <dd className="font-semibold">{item.product.stockTotal.toLocaleString("tr-TR")} adet</dd>
                          </div>
                        </dl>
                        {item.product.slug ? (
                          <Link
                            href={productPath(item.product.slug)}
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-navy hover:text-orange"
                          >
                            Vitrinde aç
                            <ExternalLink className="size-3.5" />
                          </Link>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-[15px] font-extrabold text-navy">₺{formatPriceTry(item.lineTotal)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-line pt-3 text-[13px]">
              <div className="flex justify-between">
                <dt>Ara toplam (KDV hariç)</dt>
                <dd>₺{formatPriceTry(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>KDV</dt>
                <dd>₺{formatPriceTry(order.vatTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Kargo</dt>
                <dd>
                  {Number(order.shippingTotal) === 0 ? "Ücretsiz" : `₺${formatPriceTry(order.shippingTotal)}`}
                </dd>
              </div>
              {Number(order.discountTotal) > 0 ? (
                <div className="flex justify-between">
                  <dt>Kupon{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                  <dd>−₺{formatPriceTry(order.discountTotal)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between font-extrabold text-navy">
                <dt>Genel toplam</dt>
                <dd>₺{formatPriceTry(order.grandTotal)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-line bg-white p-5">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Teslimat</h2>
            <dl className="mt-3">
              <Row label="Ad soyad" value={order.shipFullName} />
              <Row label="Telefon" value={formatPhoneTR(order.shipPhone) || order.shipPhone} />
              <Row label="Adres" value={order.shipLine} />
              <Row label="İlçe / İl" value={`${order.shipDistrict} / ${order.shipCity}`} />
              <Row label="Kargo firması" value={isCargoCompany(order.cargoCompany) ? CARGO_COMPANIES[order.cargoCompany] : order.cargoCompany} />
              <Row label="Takip no" value={order.trackingNo} />
              <Row label="Takip linki" value={order.trackingUrl} />
              {note.rows.map((row) => (
                <Row key={`${row.label}-${row.value}`} label={row.label} value={row.value} />
              ))}
            </dl>
            {note.extra ? (
              <p className="mt-3 whitespace-pre-line rounded bg-soft p-3 text-[12px] text-[#555]">{note.extra}</p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border border-line bg-white p-5 text-[13px]">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Müşteri</h2>
            <dl className="mt-3">
              <Row label="Ad" value={order.user.name} />
              <Row label="E-posta" value={order.user.email} />
              <Row label="Telefon" value={formatPhoneTR(order.user.phone ?? "") || order.user.phone} />
            </dl>
            <Link
              href={`/admin/musteriler/${order.user.id}`}
              className="mt-3 inline-block font-bold text-navy hover:text-orange"
            >
              Müşteri kartı
            </Link>
          </section>
          <section className="rounded-md border border-line bg-white p-5 text-[13px]">
            <h2 className="text-[14px] font-extrabold tracking-wide uppercase">Ödeme</h2>
            {payment ? (
              <dl className="mt-3">
                <div className="border-b border-line py-2.5">
                  <dt className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">Durum</dt>
                  <dd className="mt-1">
                    <StatusBadge status={payment.status} kind="payment" />
                  </dd>
                </div>
                <Row
                  label="Yöntem"
                  value={
                    payment.provider === "iyzico"
                      ? "Kredi kartı (Iyzico)"
                      : payment.provider === "transfer"
                        ? "Havale / EFT"
                        : payment.provider
                  }
                />
                <Row label="Tutar" value={`₺${formatPriceTry(payment.amount)} ${payment.currency}`} />
                <Row label="Kayıt" value={formatDateTimeTr(payment.createdAt)} />
                <Row label="Güncelleme" value={formatDateTimeTr(payment.updatedAt)} />
                <Row label="İşlem no" value={payment.conversationId} />
                <Row label="Sağlayıcı ID" value={payment.providerPaymentId} />
                <Row label="Hata" value={payment.errorMessage} />
              </dl>
            ) : (
              <p className="mt-3 text-[#6b7280]">Ödeme kaydı yok.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
