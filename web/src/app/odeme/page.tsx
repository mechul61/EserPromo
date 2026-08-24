import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { CheckoutView, type CheckoutLine } from "@/components/commerce/CheckoutView";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { getCurrentUser } from "@/lib/auth/session";
import { getCart, appliedCouponFor } from "@/lib/commerce/cart";
import { lineTotals } from "@/lib/commerce/orders";
import { getEnabledTransferBanks } from "@/lib/commerce/transfer-banks";
import { getCheckoutPaymentMethods, iyzicoIsReady } from "@/lib/commerce/payments";
import { getSiteSettings } from "@/lib/site-settings";
import { mediaUrl } from "@/lib/media";

export const metadata = {
  title: "Sipariş Tamamlama",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [user, cart, transferBanks, paymentMethods, iyzicoReady, settings] = await Promise.all([
    getCurrentUser(),
    getCart(),
    getEnabledTransferBanks(),
    getCheckoutPaymentMethods(),
    iyzicoIsReady(),
    getSiteSettings(),
  ]);

  if (!cart || cart.items.length === 0) redirect("/sepet");
  const coupon = await appliedCouponFor(cart);

  const checkout = cart.items.reduce<{
    items: CheckoutLine[];
    subtotal: number;
    vat: number;
    vatRates: Set<number>;
  }>(
    (acc, item) => {
      const net = Number(item.product.price);
      const vatRate = Number(item.product.vatRate);
      const t = lineTotals(net, vatRate, item.quantity);
      acc.items.push({
        name: item.product.title || item.product.name,
        color: item.product.color,
        quantity: item.quantity,
        image: mediaUrl(item.product.images[0]?.localPath) ?? "/brand/logo.png",
        lineNet: t.subtotal,
      });
      acc.subtotal += t.subtotal;
      acc.vat += t.vatTotal;
      acc.vatRates.add(vatRate);
      return acc;
    },
    { items: [], subtotal: 0, vat: 0, vatRates: new Set<number>() },
  );

  const vatLabel = checkout.vatRates.size === 1 ? `KDV (%${[...checkout.vatRates][0]})` : "KDV";

  return (
    <ShopChrome mainClassName="py-6">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
        <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
          <Home className="size-3.5" />
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/" className="hover:text-navy">
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/sepet" className="hover:text-navy">
          Sepetim
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-[#555]">Sipariş Tamamlama</span>
      </nav>

      <CheckoutView
        loggedIn={Boolean(user)}
        iyzicoReady={iyzicoReady}
        paymentMethods={paymentMethods}
        userName={user?.name}
        userEmail={user?.email}
        items={checkout.items}
        subtotal={checkout.subtotal}
        vat={checkout.vat}
        vatLabel={vatLabel}
        coupon={coupon}
        transferBanks={transferBanks}
        orderNoteEnabled={settings.order.orderNoteEnabled}
        minOrderAmount={settings.order.minimumOrderAmount}
        shipping={settings.shipping}
      />
    </ShopChrome>
  );
}
