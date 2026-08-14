import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { CheckoutView, type CheckoutLine } from "@/components/commerce/CheckoutView";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrCreateCart } from "@/lib/commerce/cart";
import { lineTotals } from "@/lib/commerce/orders";
import { iyzicoReady } from "@/lib/env";
import { mediaUrl } from "@/lib/media";
import { grossPrice } from "@/lib/product-detail";

export const metadata = {
  title: "Sipariş Tamamlama",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const cart = await getOrCreateCart();

  if (cart.items.length === 0) redirect("/sepet");

  let subtotal = 0;
  let vat = 0;
  const vatRates = new Set<number>();
  const items: CheckoutLine[] = cart.items.map((item) => {
    const net = Number(item.product.price);
    const vatRate = Number(item.product.vatRate);
    const t = lineTotals(net, vatRate, item.quantity);
    subtotal += t.subtotal;
    vat += t.vatTotal;
    vatRates.add(vatRate);
    return {
      name: item.product.title || item.product.name,
      color: item.product.color,
      quantity: item.quantity,
      image: mediaUrl(item.product.images[0]?.localPath) ?? "/brand/logo.png",
      lineGross: grossPrice(net, vatRate) * item.quantity,
    };
  });

  const vatLabel = vatRates.size === 1 ? `KDV (%${[...vatRates][0]})` : "KDV";

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
        iyzicoReady={iyzicoReady()}
        userName={user?.name}
        userEmail={user?.email}
        items={items}
        subtotal={subtotal}
        vat={vat}
        vatLabel={vatLabel}
      />
    </ShopChrome>
  );
}
