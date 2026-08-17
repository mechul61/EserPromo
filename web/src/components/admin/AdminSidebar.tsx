"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Özet", icon: LayoutDashboard },
  { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingCart },
  { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
  { href: "/admin/urunler", label: "Ürünler", icon: Package },
  { href: "/admin/kategoriler", label: "Kategoriler", icon: FolderTree },
  { href: "/admin/senkron", label: "Senkron", icon: RefreshCw },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  return (
    <aside className="flex h-full min-h-dvh w-full flex-col bg-navy text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-orange uppercase">Eser Promo</p>
        <p className="mt-1 text-[16px] font-extrabold tracking-wide">Yönetim</p>
      </div>
      <nav className="flex-1 py-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-5 py-2.5 text-[13px] ${
                active ? "bg-white/10 font-extrabold text-orange" : "font-medium text-white/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-5 py-4 text-[12px]">
        <p className="truncate font-semibold text-white/90">{name}</p>
        <div className="mt-3 flex flex-col gap-1.5">
          <Link href="/" className="text-white/70 hover:text-white">
            Siteye dön
          </Link>
          <Link href="/hesabim" className="text-white/70 hover:text-white">
            Hesabım
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 text-left text-white/70 hover:text-white"
          >
            <LogOut className="size-3.5" />
            Çıkış
          </button>
        </div>
      </div>
    </aside>
  );
}
