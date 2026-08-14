import Link from "next/link";
import {
  Heart,
  Phone,
  Search,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { getCurrentUser } from "@/lib/auth/session";
import { peekCartCount } from "@/lib/commerce/cart";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const cartCount = await peekCartCount();

  return (
    <header className="border-b border-line bg-white">
      <div className="container-ep grid grid-cols-1 items-center gap-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
        <div className="flex justify-center lg:justify-start">
          <Logo size="md" />
        </div>

        <form
          className="relative w-full"
          action="/arama"
          method="get"
          role="search"
        >
          <input
            name="q"
            type="search"
            placeholder="Ürün adı, kodu veya kategori ile arayın..."
            className="h-12 w-full rounded-md border border-[#cfd6e0] bg-white pr-14 pl-4 text-sm outline-none transition focus:border-navy"
          />
          <button
            type="submit"
            className="absolute top-1 right-1 flex h-10 w-11 items-center justify-center rounded bg-navy text-white hover:bg-navy-deep"
            aria-label="Ara"
          >
            <Search className="size-4" />
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-end lg:gap-5">
          <div className="hidden items-start gap-2 xl:flex">
            <Phone className="mt-0.5 size-5 text-navy" />
            <div className="text-[12px] leading-tight">
              <p className="font-semibold text-navy">Müşteri Hattı</p>
              <p className="font-bold text-[#111]">0212 000 00 00</p>
              <p className="text-muted">0850 000 00 00</p>
            </div>
          </div>

          <a
            href="https://wa.me/905000000000"
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

          <Link href={user ? "/hesabim" : "/giris"} className="flex items-start gap-2">
            <UserRound className="mt-0.5 size-5 text-navy" />
            <span className="text-[12px] leading-tight">
              <span className="block font-semibold text-navy">Hesabım</span>
              <span className="text-muted">{user ? user.name : "Giriş / Üye Ol"}</span>
            </span>
          </Link>

          <Link href="/favoriler" className="relative flex flex-col items-center gap-0.5 text-[11px]">
            <Heart className="size-5 text-navy" />
            <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
              0
            </span>
            <span className="font-medium text-navy">Favorilerim</span>
          </Link>

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
