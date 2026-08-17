import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AccountChrome } from "@/components/account/AccountChrome";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDateTr } from "@/lib/account";
import { getUserOrder, ORDER_STATUS_LABEL } from "@/lib/commerce/orders";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { formatPhoneTR } from "@/lib/phone";

export const metadata = {
  title: "Sipariş | Eser Promo",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ no: string }> };

function NoteRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">{label}</dt>
      <dd className="text-[13px] font-semibold break-words text-[#111]">{value}</dd>
    </div>
  );
}

export default async function OrderDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const { no } = await params;
  const order = await getUserOrder(user.id, no);
  if (!order) notFound();

  const status = ORDER_STATUS_LABEL[order.status] ?? order.status;

  return (
    <AccountChrome
      title={order.publicNumber}
      subtitle={`${status} · ${formatDateTr(order.createdAt)}`}
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { href: "/siparislerim", label: "Siparişlerim" },
        { label: order.publicNumber },
      ]}
    >
      <div className="space-y-4">
        <Link
          href="/siparislerim"
          className="inline-flex items-center gap-1 text-[13px] font-bold text-navy hover:text-orange"
        >
          <ArrowLeft className="size-4" />
          Siparişlerime dön
        </Link>

        <section className="rounded-md border border-line bg-white p-5">
          <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Sipariş Özeti</h2>
          <dl className="mt-3">
            <NoteRow label="Sipariş No" value={order.publicNumber} />
            <NoteRow label="Durum" value={status} />
            <NoteRow label="Tarih" value={formatDateTr(order.createdAt)} />
            <NoteRow
              label="Ödeme"
              value={
                order.payments[0]
                  ? `${order.payments[0].provider === "iyzico" ? "Kredi kartı" : order.payments[0].provider === "transfer" ? "Havale / EFT" : order.payments[0].provider} · ${order.payments[0].status}`
                  : "—"
              }
            />
          </dl>
        </section>

        <section className="rounded-md border border-line bg-white p-5">
          <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Ürünler</h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items.map((item) => {
              const image = mediaUrl(item.product.images[0]?.localPath) ?? "/brand/logo.png";
              return (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded border border-line bg-soft">
                    <Image src={image} alt="" fill unoptimized className="object-contain p-1" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-extrabold text-navy">{item.name}</p>
                    {item.color ? <p className="mt-0.5 text-[13px] text-[#6b7280]">{item.color}</p> : null}
                    <p className="text-[13px] text-[#6b7280]">
                      {item.quantity.toLocaleString("tr-TR")} adet · SKU {item.sku}
                    </p>
                  </div>
                  <p className="shrink-0 text-[14px] font-extrabold text-navy">₺{formatPriceTry(item.lineTotal)}</p>
                </li>
              );
            })}
          </ul>
          <dl className="mt-2 space-y-2 border-t border-line pt-4 text-[14px]">
            <div className="flex justify-between gap-3">
              <dt className="text-[#666]">Ara Toplam</dt>
              <dd className="font-semibold">₺{formatPriceTry(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#666]">KDV</dt>
              <dd className="font-semibold">₺{formatPriceTry(order.vatTotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#666]">Kargo</dt>
              <dd className="font-semibold">
                {Number(order.shippingTotal) === 0 ? "Ücretsiz" : `₺${formatPriceTry(order.shippingTotal)}`}
              </dd>
            </div>
            <div className="flex items-end justify-between gap-3 pt-1">
              <dt className="text-[13px] font-extrabold uppercase">Genel Toplam</dt>
              <dd className="text-[20px] font-extrabold text-navy">₺{formatPriceTry(order.grandTotal)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-md border border-line bg-white p-5">
          <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Teslimat</h2>
          <dl className="mt-3">
            <NoteRow label="Ad Soyad" value={order.shipFullName} />
            <NoteRow label="Telefon" value={formatPhoneTR(order.shipPhone) || order.shipPhone} />
            <NoteRow label="İlçe / Şehir" value={`${order.shipDistrict} / ${order.shipCity}`} />
            <NoteRow label="Adres" value={order.shipLine} />
          </dl>
        </section>

        {order.customerNote ? (
          <section className="rounded-md border border-line bg-white p-5">
            <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Sipariş Notu</h2>
            <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-[#333]">{order.customerNote}</p>
          </section>
        ) : null}

        {order.status === "pending_payment" ? (
          <p className="text-[13px] text-[#6b7280]">
            {order.payments[0]?.provider === "transfer"
              ? "Yukarıdaki hesap bilgilerine ödemeyi yaptıktan sonra dekontu e-posta veya WhatsApp ile gönderin. Ödemeniz görünince sipariş hazırlığa alınır."
              : "Ödeme Iyzico anahtarları tanımlanınca bu ekranda açılacak. Kart numarası sitemizde saklanmaz."}
          </p>
        ) : null}
      </div>
    </AccountChrome>
  );
}
