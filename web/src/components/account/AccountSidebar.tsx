"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FileText,
  Headphones,
  Heart,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  RefreshCcw,
  Shield,
  UserRound,
} from "lucide-react";
import { SITE_CONTACT } from "@/data/catalog-page";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const NAV = [
  { href: "/hesabim", label: "Profil Bilgilerim", icon: UserRound },
  { href: "/hesabim/adreslerim", label: "Adreslerim", icon: MapPin },
  { href: "/siparislerim", label: "Siparişlerim", icon: Package },
  { href: "/hesabim/teklifler", label: "Teklif Taleplerim", icon: FileText },
  { href: "/favoriler", label: "Favorilerim", icon: Heart },
  { href: "/hesabim/iadeler", label: "İade & Değişim Taleplerim", icon: RefreshCcw },
  { href: "/hesabim/destek", label: "Destek Taleplerim", icon: Headphones },
  { href: "/hesabim/bildirimler", label: "Bildirimlerim", icon: Bell },
  { href: "/hesabim/sifre", label: "Şifre Değiştir", icon: KeyRound },
  { href: "/hesabim/guvenlik", label: "Hesap Güvenliği", icon: Shield },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/hesabim") return pathname === "/hesabim";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  return (
    <aside className="w-full overflow-hidden rounded-md border border-line bg-white">
      <div className="bg-navy px-4 py-3 text-[13px] font-extrabold tracking-wide text-white">
        HESABIM
      </div>
      <nav className="py-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] ${
                active ? "bg-[#fff8f0] font-extrabold text-orange" : "font-medium text-[#555] hover:bg-soft"
              }`}
            >
              <Icon className={`size-4 shrink-0 ${active ? "text-orange" : "text-[#8b919a]"}`} />
              {item.label}
            </Link>
          );
        })}
        {isAdmin ? (
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-extrabold text-navy hover:bg-soft"
          >
            <LayoutDashboard className="size-4 shrink-0 text-orange" />
            Yönetim Paneli
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-[#555] hover:bg-soft"
        >
          <LogOut className="size-4 shrink-0 text-[#8b919a]" />
          Çıkış Yap
        </button>
      </nav>
      <div className="bg-navy px-4 py-4 text-white">
        <p className="text-[12px] font-extrabold tracking-wide">BİZE ULAŞIN</p>
        <ul className="mt-3 space-y-2 text-[12px] text-white/85">
          <li>
            <a href={SITE_CONTACT.phoneTel} className="hover:text-white">
              {SITE_CONTACT.phone}
            </a>
          </li>
          <li>
            <a href={SITE_CONTACT.whatsappHref} className="inline-flex items-center gap-1.5 hover:text-white">
              <WhatsAppIcon className="size-3.5" />
              {SITE_CONTACT.whatsapp}
            </a>
          </li>
          <li>
            <a href={`mailto:${SITE_CONTACT.email}`} className="hover:text-white">
              {SITE_CONTACT.email}
            </a>
          </li>
          <li className="leading-relaxed text-white/70">{SITE_CONTACT.address}</li>
        </ul>
      </div>
    </aside>
  );
}
