import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AccountChrome } from "@/components/account/AccountChrome";
import { ShippingTracker } from "@/components/account/ShippingTracker";
import { getCurrentUser } from "@/lib/auth/session";
import { formatDateTr } from "@/lib/account";
import { customerShippingCopy, getUserOrder, isOfficePickup } from "@/lib/commerce/orders";
import { iyzicoIsReady } from "@/lib/commerce/payments";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { formatPhoneTR } from "@/lib/phone";

export const metadata = {
  title: "Sipariş | Eser Promo",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ no: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function paymentNotice(query: Record<string, string | string[] | undefined>) {
  const status = typeof query.odeme === "string" ? query.odeme : "";
  const message = typeof query.mesaj === "string" ? query.mesaj : "";
  if (status === "basarili") {
    return { tone: "success" as const, text: "Ödemeniz alındı. Siparişiniz hazırlık sürecine alınacak." };
  }
  if (status === "basarisiz") {
    return {
      tone: "error" as const,
      text: message || "Ödeme tamamlanamadı. Tekrar deneyebilir veya farklı bir yöntem seçebilirsiniz.",
    };
  }
  if (status === "hata") {
    return { tone: "error" as const, text: message || "Ödeme sonucu işlenemedi." };
  }
  return null;
}

function NoteRow({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-4">
      <dt className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">{label}</dt>
      <dd className="text-[13px] font-semibold break-words text-[#111]">{value}</dd>
    </div>
  );
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const { no } = await params;
  const query = await searchParams;
  const order = await getUserOrder(user.id, no);
  if (!order) notFound();

  const cardPayment = order.payments.find((row) => row.provider === "iyzico");
  const canPayByCard =
    order.status === "pending_payment" &&
    cardPayment?.status === "pending" &&
    (await iyzicoIsReady());
  const notice = paymentNotice(query);

  const officePickup = isOfficePickup(order.customerNote);
  const shipping = customerShippingCopy(order.status, officePickup);

  return (
    <AccountChrome
      title={order.publicNumber}
      subtitle={`${shipping.title} · ${formatDateTr(order.createdAt)}`}
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

        {notice ? (
          <p
            className={`rounded-md border px-4 py-3 text-[13px] font-semibold ${
              notice.tone === "success"
                ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
                : "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]"
            }`}
          >
            {notice.text}
          </p>
        ) : null}

        <ShippingTracker
          status={order.status}
          officePickup={officePickup}
          trackingNo={order.trackingNo}
          trackingUrl={order.trackingUrl}
          cargoCompany={order.cargoCompany}
        />

        <section className="rounded-md border border-line bg-white p-5">
          <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">Sipariş Özeti</h2>
          <dl className="mt-3">
            <NoteRow label="Sipariş No" value={order.publicNumber} />
            <NoteRow label="Durum" value={shipping.title} />
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
                  <div className="shrink-0 text-right">
                    <p className="text-[14px] font-extrabold text-navy">
                      ₺{formatPriceTry(Number(item.unitPrice) * item.quantity)}
                    </p>
                    <p className="text-[10px] text-[#8b919a]">+ KDV</p>
                  </div>
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
            {Number(order.discountTotal) > 0 ? (
              <div className="flex justify-between gap-3">
                <dt className="text-[#666]">Kupon{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd className="font-semibold text-brand-green">−₺{formatPriceTry(order.discountTotal)}</dd>
              </div>
            ) : null}
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
          <div className="space-y-3">
            {order.payments[0]?.provider === "transfer" ? (
              <p className="text-[13px] text-[#6b7280]">
                Yukarıdaki hesap bilgilerine ödemeyi yaptıktan sonra dekontu e-posta veya WhatsApp ile
                gönderin. Ödemeniz görününce sipariş hazırlığa alınır.
              </p>
            ) : canPayByCard ? (
              <>
                <p className="text-[13px] text-[#6b7280]">
                  Kart ödemesi Iyzico güvenli sayfasında tamamlanır. Kart bilgileriniz sitemizde saklanmaz.
                </p>
                <Link
                  href={`/siparislerim/${order.publicNumber}/odeme/`}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-navy px-5 text-[13px] font-bold text-white hover:bg-orange"
                >
                  Kart ile öde
                </Link>
              </>
            ) : (
              <p className="text-[13px] text-[#6b7280]">
                Kart ödemesi henüz yapılandırılmadı. Lütfen daha sonra tekrar deneyin veya havale/EFT kullanın.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </AccountChrome>
  );
}
