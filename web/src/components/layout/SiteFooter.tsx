import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-navy text-white">
      <div className="container-ep grid gap-8 py-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="inline-flex rounded-md bg-white px-3 py-2">
            <Logo size="sm" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Promosyon ürünlerinde doğru adres. Logo baskılı üretim, hızlı teklif
            ve Türkiye geneli teslimat.
          </p>
        </div>
        <div>
          <h4 className="font-bold">Kurumsal</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>
              <Link href="/hakkimizda">Hakkımızda</Link>
            </li>
            <li>
              <Link href="/baski-teknikleri">Baskı Teknikleri</Link>
            </li>
            <li>
              <Link href="/blog">Blog</Link>
            </li>
            <li>
              <Link href="/iletisim">İletişim</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold">Hizmetler</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>
              <Link href="/teklif">Toplu Alım / Teklif</Link>
            </li>
            <li>
              <Link href="/logolu-siparis">Logolu Sipariş</Link>
            </li>
            <li>
              <Link href="/product-category/kampanyali">Kampanyalı Ürünler</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold">İletişim</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>0212 000 00 00</li>
            <li>0850 000 00 00</li>
            <li>info@eserpromo.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Eser Promo. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
