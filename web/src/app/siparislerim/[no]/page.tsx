import { notFound, redirect } from "next/navigation";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserOrder } from "@/lib/commerce/orders";
import { formatPriceTry } from "@/lib/media";

export const metadata = {
  title: "Sipariş | Eser Promo",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ no: string }> };

export default async function OrderDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const { no } = await params;
  const order = await getUserOrder(user.id, no);
  if (!order) notFound();

  return (
    <ShopChrome>
      <h1 className="text-[24px] font-extrabold text-navy">{order.publicNumber}</h1>
      <p className="mt-1 text-[14px] text-muted">Durum: {order.status}</p>
      <ul className="mt-6 space-y-2 rounded-xl border border-line bg-white p-4">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between text-[14px]">
            <span>
              {item.name} {item.color ? `(${item.color})` : ""} × {item.quantity}
            </span>
            <span className="font-semibold">₺{formatPriceTry(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[18px] font-extrabold">Toplam: ₺{formatPriceTry(order.grandTotal)}</p>
      {order.status === "pending_payment" ? (
        <p className="mt-4 max-w-lg text-[13px] text-muted">
          Ödeme Iyzico anahtarları tanımlanınca bu ekranda açılacak. Kart numarası sitemizde saklanmaz.
        </p>
      ) : null}
    </ShopChrome>
  );
}
