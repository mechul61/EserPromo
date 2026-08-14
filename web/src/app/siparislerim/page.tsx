import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatPriceTry } from "@/lib/media";

export const metadata = {
  title: "Siparişlerim",
  robots: { index: false, follow: false },
};

const statusLabel: Record<string, string> = {
  draft: "Taslak",
  pending_payment: "Ödeme bekleniyor",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  completed: "Tamamlandı",
  cancelled: "İptal",
  failed: "Başarısız",
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ShopChrome>
      <h1 className="text-[24px] font-extrabold text-navy">Siparişlerim</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted">Henüz siparişiniz yok.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-xl border border-line bg-white p-4">
              <Link href={`/siparislerim/${order.publicNumber}`} className="font-bold text-navy">
                {order.publicNumber}
              </Link>
              <p className="text-[13px] text-muted">
                {statusLabel[order.status] ?? order.status} · ₺{formatPriceTry(order.grandTotal)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ShopChrome>
  );
}
