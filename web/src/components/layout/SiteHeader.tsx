import Link from "next/link";
import {
  Phone,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { FavoriteHeaderLink } from "@/components/favorites/FavoriteHeaderLink";
import { SiteSearchForm } from "@/components/layout/SiteSearchForm";
import { getCurrentUser } from "@/lib/auth/session";
import { peekCartCount } from "@/lib/commerce/cart";
import { getSiteContact } from "@/lib/site-settings";
import { phoneTelFrom } from "@/lib/site-settings-copy";

export async function SiteHeader({ searchQuery = "" }: { searchQuery?: string }) {
  const [user, cartCount, contact] = await Promise.all([
    getCurrentUser(),
    peekCartCount(),
    getSiteContact(),
  ]);

  return (
    <header className="border-b border-line bg-white">
      <div className="container-ep grid grid-cols-1 items-center gap-3 py-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
        <div className="flex justify-center lg:justify-start">
          <Logo size="md" />
        </div>

        <SiteSearchForm defaultQuery={searchQuery} />

        <div className="flex min-w-0 flex-wrap items-center justify-center gap-3 sm:gap-4 lg:justify-end lg:gap-5">
          <div className="hidden items-start gap-2 xl:flex">
            <Phone className="mt-0.5 size-5 text-navy" />
            <div className="text-[12px] leading-tight">
              <p className="font-semibold text-navy">Müşteri Hattı</p>
              <a href={contact.phoneTel} className="block font-bold text-[#111] hover:text-navy">
                {contact.phone}
              </a>
              <a href={phoneTelFrom(contact.whatsapp)} className="block text-muted hover:text-navy">
                {contact.whatsapp}
              </a>
            </div>
          </div>

          <a
            href={contact.whatsappHref}
            className="hidden items-start gap-2 md:flex"
          >
            <span className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-[#25D366] text-white">
              <WhatsAppIcon className="size-4" />
            </span>
            <span className="text-[12px] leading-tight">
              <span className="block font-semibold text-navy">Hızlı Destek</span>
              <span className="font-medium text-[#111]">WhatsApp ile Yazın</span>
            </span>
          </a>

          <Link href={user ? "/hesabim" : "/giris"} className="flex min-w-0 items-start gap-2">
            <UserRound className="mt-0.5 size-5 text-navy" />
            <span className="min-w-0 text-[12px] leading-tight">
              <span className="block font-semibold text-navy">Hesabım</span>
              <span className="block truncate text-muted">{user ? user.name : "Giriş / Üye Ol"}</span>
            </span>
          </Link>

          <FavoriteHeaderLink />

          <Link href="/sepet" className="relative flex flex-col items-center gap-0.5 text-[11px]">
            <ShoppingCart className="size-5 text-navy" />
            <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
              {Math.min(cartCount, 99)}
            </span>
            <span className="font-medium text-navy">Sepetim</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
