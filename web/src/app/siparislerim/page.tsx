import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AccountChrome } from "@/components/account/AccountChrome";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatDateTr } from "@/lib/account";
import { ORDER_STATUS_LABEL } from "@/lib/commerce/orders";
import { formatPriceTry } from "@/lib/media";

export const metadata = {
  title: "Siparişlerim",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <AccountChrome
      title="Siparişlerim"
      subtitle="Sipariş geçmişinizi görüntüleyin."
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: "Siparişlerim" },
      ]}
    >
      {orders.length === 0 ? (
        <div className="rounded-md border border-line bg-white p-6 text-[14px] text-[#555]">
          Henüz siparişiniz yok.
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/siparislerim/${order.publicNumber}`}
                className="flex items-center justify-between gap-4 rounded-md border border-line bg-white p-4 hover:border-orange hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-extrabold text-navy">{order.publicNumber}</p>
                  <p className="mt-1 text-[13px] text-[#6b7280]">
                    {ORDER_STATUS_LABEL[order.status] ?? order.status} ·{" "}
                    {order._count.items.toLocaleString("tr-TR")} ürün · {formatDateTr(order.createdAt)}
                  </p>
                  <p className="mt-1 text-[14px] font-extrabold text-[#111]">
                    ₺{formatPriceTry(order.grandTotal)}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-extrabold tracking-wide text-navy">
                  Detay
                  <ChevronRight className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountChrome>
  );
}
