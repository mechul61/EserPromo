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
import { prisma } from "@/lib/db";
import { formatPhoneTR } from "@/lib/phone";
import { SITE_CONTACT } from "@/data/catalog-page";

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

  const [savedAddresses, profilePhone] = user
    ? await Promise.all([
        prisma.address.findMany({
          where: { userId: user.id },
          orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            title: true,
            fullName: true,
            email: true,
            phone: true,
            city: true,
            district: true,
            postalCode: true,
            line: true,
            isDefault: true,
          },
        }),
        prisma.user.findUnique({
          where: { id: user.id },
          select: { phone: true },
        }),
      ])
    : [[], null];

  // Eski siparişlerden adres yoksa son teslimat bilgisini yedek olarak kullan.
  let addressesForCheckout = savedAddresses;
  if (user && addressesForCheckout.length === 0) {
    const lastOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        shipLine: { not: "" },
        NOT: { shipLine: SITE_CONTACT.address },
      },
      orderBy: { createdAt: "desc" },
      select: {
        shipFullName: true,
        shipPhone: true,
        shipCity: true,
        shipDistrict: true,
        shipLine: true,
      },
    });
    if (lastOrder?.shipLine) {
      addressesForCheckout = [
        {
          id: "last-order",
          title: "Son sipariş",
          fullName: lastOrder.shipFullName,
          email: user.email,
          phone: lastOrder.shipPhone,
          city: lastOrder.shipCity,
          district: lastOrder.shipDistrict,
          postalCode: "",
          line: lastOrder.shipLine,
          isDefault: true,
        },
      ];
    }
  }

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
        userPhone={formatPhoneTR(profilePhone?.phone ?? "") || ""}
        savedAddresses={addressesForCheckout.map((address) => ({
          id: address.id,
          title: address.title,
          fullName: address.fullName,
          email: address.email,
          phone: formatPhoneTR(address.phone) || address.phone,
          city: address.city,
          district: address.district,
          postalCode: address.postalCode,
          line: address.line,
          isDefault: address.isDefault,
        }))}
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
