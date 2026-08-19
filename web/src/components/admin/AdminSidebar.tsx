"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BadgePercent,
  ChevronRight,
  ClipboardList,
  FileBarChart2,
  FolderTree,
  Landmark,
  LayoutDashboard,
  LogOut,
  Mail,
  Package,
  PanelsTopLeft,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  SquareStack,
  Users,
  Wrench,
} from "lucide-react";

type MenuChild = { href: string; label: string };

type MenuItem = {
  id: string;
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  children?: MenuChild[];
};

const ITEMS: MenuItem[] = [
  { id: "home", href: "/admin", label: "Anasayfa", icon: LayoutDashboard },
  { id: "orders", href: "/admin/siparisler", label: "Siparişler", icon: ShoppingCart },
  { id: "products", href: "/admin/urunler", label: "Ürünler", icon: Package },
  { id: "categories", href: "/admin/kategoriler", label: "Kategoriler", icon: FolderTree },
  { id: "coupons", href: "/admin/kuponlar", label: "Kuponlar", icon: BadgePercent },
  { id: "customers", href: "/admin/musteriler", label: "Müşteriler", icon: Users },
  { id: "banners", href: "/admin/bannerlar", label: "Banner / Slider", icon: PanelsTopLeft },
  { id: "popups", href: "/admin/popuplar", label: "Popup Yönetimi", icon: SquareStack },
  { id: "settings", href: "/admin/ayarlar", label: "Site Ayarları", icon: Wrench },
  { id: "shipping", href: "/admin/kargo", label: "Kargo Yönetimi", icon: ShoppingBag },
  { id: "payments", href: "/admin/odemeler", label: "Ödeme Yöntemleri", icon: Landmark },
  { id: "email", href: "/admin/eposta", label: "E-posta Ayarları", icon: Mail },
  { id: "reports", href: "/admin/raporlar", label: "Raporlar", icon: FileBarChart2 },
  { id: "support", href: "/admin/destek", label: "Destek Talepleri", icon: ClipboardList },
  { id: "backup", href: "/admin/senkron", label: "Sistem Yedekleme", icon: RefreshCw },
  { id: "users", href: "/admin/kullanicilar", label: "Kullanıcılar", icon: ShieldCheck },
];

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function isActive(pathname: string, section: string | null, item: MenuItem) {
  const path = normalizePath(pathname);

  if (item.id === "home") {
    return path === "/admin" && !section;
  }

  if (item.href.startsWith("/admin?section=")) {
    const wanted = item.href.split("section=")[1];
    return path === "/admin" && section === wanted;
  }

  const base = normalizePath(item.href);
  return path === base || path.startsWith(`${base}/`);
}

export function AdminSidebar({
  name,
  supportWaiting = 0,
  ordersWaiting = 0,
}: {
  name: string;
  supportWaiting?: number;
  ordersWaiting?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  async function logout() {
    await fetch("/api/auth/logout/", { method: "POST" });
    router.replace("/");
    router.refresh();
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#0b1524] text-white">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="relative mx-auto h-12 w-[148px]">
          <Image src="/brand/logo.png" alt="Eser Promo" fill className="object-contain" sizes="148px" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-[86px] top-[14px] text-[28px] font-semibold italic leading-none text-white"
          >
            Promo
          </span>
        </div>
        <p className="mt-1 text-center text-[10px] font-semibold tracking-[0.22em] text-white/70 uppercase">
          Kontrol Paneli
        </p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3">
        <p className="px-5 pb-2 text-[10px] font-bold tracking-[0.18em] text-white/35 uppercase">Ana Menü</p>
        <div className="space-y-0.5 px-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, section, item);
            const badge =
              item.id === "orders" && ordersWaiting > 0
                ? String(ordersWaiting)
                : item.id === "support" && supportWaiting > 0
                  ? String(supportWaiting)
                  : null;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] ${
                  active
                    ? "bg-[#1560ff] font-extrabold text-white shadow-[0_6px_18px_rgba(21,96,255,0.35)]"
                    : "font-medium text-white/80 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {badge ? (
                  <span
                    className={`grid min-w-[18px] place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      active ? "bg-white/20 text-white" : "bg-[#1560ff] text-white"
                    }`}
                  >
                    {badge}
                  </span>
                ) : null}
                {item.children?.length ? <ChevronRight className="size-3.5 shrink-0 opacity-70" /> : null}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-white/80 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="flex-1">Çıkış Yap</span>
          </button>
        </div>
      </nav>
      <p className="sr-only">{name}</p>
    </aside>
  );
}
