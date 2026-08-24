import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AccountChrome } from "@/components/account/AccountChrome";
import { IyzicoCheckout } from "@/components/commerce/IyzicoCheckout";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrder } from "@/lib/commerce/orders";
import { iyzicoIsReady } from "@/lib/commerce/payments";
import { formatPriceTry } from "@/lib/media";

export const metadata = {
  title: "Kart ile Öde | Eser Promo",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ no: string }> };

export default async function OrderPaymentPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const { no } = await params;
  const order = await getUserOrder(user.id, no);
  if (!order) notFound();

  const payment = order.payments.find((row) => row.provider === "iyzico");
  if (!payment) notFound();

  if (payment.status === "success" || order.status !== "pending_payment") {
    redirect(`/siparislerim/${order.publicNumber}/`);
  }

  const ready = await iyzicoIsReady();
  if (!ready) {
    redirect(`/siparislerim/${order.publicNumber}/`);
  }

  return (
    <AccountChrome
      title={`Ödeme · ${order.publicNumber}`}
      subtitle="Güvenli kart ödemesi"
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { href: "/siparislerim", label: "Siparişlerim" },
        { href: `/siparislerim/${order.publicNumber}/`, label: order.publicNumber },
        { label: "Ödeme" },
      ]}
    >
      <div className="space-y-4">
        <Link
          href={`/siparislerim/${order.publicNumber}/`}
          className="inline-flex items-center gap-1 text-[13px] font-bold text-navy hover:text-orange"
        >
          <ArrowLeft className="size-4" />
          Siparişe dön
        </Link>

        <section className="rounded-md border border-line bg-white p-5">
          <p className="text-[13px] text-[#6b7280]">Ödenecek tutar</p>
          <p className="mt-1 text-[24px] font-extrabold text-navy">₺{formatPriceTry(order.grandTotal)}</p>
        </section>

        <IyzicoCheckout orderNumber={order.publicNumber} />
      </div>
    </AccountChrome>
  );
}
