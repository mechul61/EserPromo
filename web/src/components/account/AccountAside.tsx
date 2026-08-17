import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function AccountAside({
  orderCount,
  spent,
  memberSince,
  lastLogin,
}: {
  orderCount: number;
  spent: string;
  memberSince: string;
  lastLogin: string;
}) {
  return (
    <aside className="flex w-full flex-col gap-4">
      <div className="rounded-md border border-line bg-white p-5">
        <h3 className="text-[13px] font-extrabold tracking-wide text-navy uppercase">Hesap Özeti</h3>
        <dl className="mt-4 space-y-3 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#6b7280]">Toplam Sipariş</dt>
            <dd className="font-extrabold text-navy">{orderCount}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#6b7280]">Toplam Harcama</dt>
            <dd className="font-extrabold text-navy">₺{spent}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[#6b7280]">Üyelik Tarihi</dt>
            <dd className="font-semibold text-[#333]">{memberSince}</dd>
          </div>
        </dl>
        <Link
          href="/siparislerim"
          className="mt-5 flex h-11 w-full items-center justify-center rounded-md bg-orange text-[12px] font-extrabold tracking-wide text-[#111] hover:bg-orange-hover"
        >
          Siparişlerimi Görüntüle
        </Link>
      </div>

      <div className="rounded-md border border-line bg-white p-5">
        <h3 className="text-[13px] font-extrabold tracking-wide text-navy uppercase">Hızlı İşlemler</h3>
        <ul className="mt-3 divide-y divide-line text-[13px]">
          {[
            { href: "/hesabim/adreslerim", label: "Adreslerimi Yönet" },
            { href: "/hesabim/sifre", label: "Şifre Değiştir" },
            { href: "/favoriler", label: "Favorilerim" },
          ].map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex items-center justify-between py-2.5 text-[#333] hover:text-navy">
                {item.label}
                <ChevronRight className="size-4 text-[#b0b4ba]" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-line bg-white p-5">
        <h3 className="text-[13px] font-extrabold tracking-wide text-navy uppercase">Hesap Güvenliği</h3>
        <dl className="mt-4 space-y-2 text-[12px]">
          <div>
            <dt className="text-[#6b7280]">Son Giriş</dt>
            <dd className="mt-0.5 font-semibold text-[#333]">{lastLogin}</dd>
          </div>
        </dl>
        <Link
          href="/hesabim/guvenlik"
          className="mt-4 flex h-10 w-full items-center justify-center rounded-md border border-line text-[12px] font-extrabold tracking-wide text-navy hover:bg-soft"
        >
          Güvenlik Ayarlarına Git
        </Link>
      </div>
    </aside>
  );
}
