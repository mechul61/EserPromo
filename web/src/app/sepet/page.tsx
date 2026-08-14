import Image from "next/image";
import Link from "next/link";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrCreateCart } from "@/lib/commerce/cart";
import { lineTotals } from "@/lib/commerce/orders";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { iyzicoReady } from "@/lib/env";
import { productPath } from "@/lib/seo/urls";

export const metadata = {
  title: "Sepetim",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const user = await getCurrentUser();
  const cart = await getOrCreateCart();

  let subtotal = 0;
  let vat = 0;
  for (const item of cart.items) {
    const t = lineTotals(Number(item.product.price), Number(item.product.vatRate), item.quantity);
    subtotal += t.subtotal;
    vat += t.vatTotal;
  }

  return (
    <ShopChrome>
      <h1 className="text-[24px] font-extrabold text-navy">Sepetim</h1>
      {cart.items.length === 0 ? (
        <p className="mt-6 text-[14px] text-muted">
          Sepetiniz boş.{" "}
          <Link href="/" className="font-semibold text-navy">
            Alışverişe dön
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-white">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-4 p-4">
                <div className="relative size-20 shrink-0 rounded bg-soft">
                  <Image
                    src={mediaUrl(item.product.images[0]?.localPath) ?? "/brand/logo.png"}
                    alt={item.product.name}
                    fill
                    unoptimized
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={productPath(item.product.slug)} className="font-bold text-navy">
                    {item.product.name}
                  </Link>
                  <p className="text-[13px] text-muted">
                    {item.product.sku}
                    {item.product.color ? ` · ${item.product.color}` : ""} · {item.quantity} adet
                  </p>
                  <p className="mt-1 font-extrabold">₺{formatPriceTry(item.product.price)}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-[14px]">
            <p>Ara toplam (KDV hariç): ₺{formatPriceTry(subtotal)}</p>
            <p>KDV: ₺{formatPriceTry(vat)}</p>
            <p className="text-[18px] font-extrabold text-navy">
              Toplam: ₺{formatPriceTry(subtotal + vat)}
            </p>
          </div>
          <CheckoutForm loggedIn={Boolean(user)} iyzicoReady={iyzicoReady()} />
        </>
      )}
    </ShopChrome>
  );
}
