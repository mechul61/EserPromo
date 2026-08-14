import Link from "next/link";
import {
  Heart,
  Phone,
  Search,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { getCurrentUser } from "@/lib/auth/session";
import { peekCartCount } from "@/lib/commerce/cart";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.44ZM12.07 21.15h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.25c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.98c0 5.45-4.44 9.87-9.89 9.87Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

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
