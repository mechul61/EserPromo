import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { LogoutButton } from "@/components/commerce/LogoutButton";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Hesabım",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { publicNumber: true, status: true, grandTotal: true, createdAt: true },
  });

  return (
    <ShopChrome>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold text-navy">Hesabım</h1>
          <p className="mt-1 text-[14px] text-muted">{user.name} · {user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/siparislerim" className="rounded-xl border border-line bg-white p-5 font-bold text-navy hover:shadow-md">
          Siparişlerim
        </Link>
        <Link href="/sepet" className="rounded-xl border border-line bg-white p-5 font-bold text-navy hover:shadow-md">
          Sepetim
        </Link>
      </div>

      {orders.length ? (
        <ul className="mt-8 space-y-2">
          {orders.map((o) => (
            <li key={o.publicNumber}>
              <Link href={`/siparislerim/${o.publicNumber}`} className="text-[14px] font-semibold text-navy">
                {o.publicNumber}
              </Link>
              <span className="ml-2 text-[13px] text-muted">{o.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-[14px] text-muted">Henüz siparişiniz yok.</p>
      )}
    </ShopChrome>
  );
}
