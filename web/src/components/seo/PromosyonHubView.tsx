import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { LOCAL_AREA_LINKS } from "@/lib/seo/local-areas";
import { categoryPath } from "@/lib/seo/urls";

type CategoryLink = {
  name: string;
  slug: string;
  children: { name: string; slug: string }[];
};

const HIGHLIGHTS = [
  {
    title: "Logolu promosyon",
    text: "Kalem, ajanda, tekstil ve hediyelik setlerde markanıza özel baskı; vektör logo ile hızlı numune.",
  },
  {
    title: "Toplu alım teklifi",
    text: "Kurumsal siparişlerde adet bazlı fiyat, üretim takvimi ve fatura desteği.",
  },
  {
    title: "Geniş katalog",
    text: "Promosyon kalem, çanta, termos, powerbank, tekstil ve lüks hediyelik set seçenekleri.",
  },
  {
    title: "Hızlı tedarik",
    text: "Stok ürünlerde aynı gün kargo; logolu üretimde onay sonrası planlı sevkiyat.",
  },
] as const;

export function PromosyonHubView({ categories }: { categories: CategoryLink[] }) {
  return (
    <ShopChrome>
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
        <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
          <Home className="size-3.5" />
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/" className="hover:text-navy">
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-[#555]">Promosyon</span>
      </nav>

      <article className="mx-auto max-w-4xl">
        <header className="rounded-md border border-line bg-white p-6 sm:p-8">
          <h1 className="text-[28px] font-extrabold tracking-wide text-navy uppercase sm:text-[32px]">
            Promosyon Ürünleri
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#444]">
            <strong>Promosyon</strong>, markanızı müşteri, çalışan ve iş ortaklarınızla buluşturmanın en etkili
            yollarından biridir. Eser Promo olarak kurumsal hediye, fuar ve etkinlik promosyonlarında logolu baskı,
            toplu alım ve hızlı tedarik sunuyoruz. Kalem, ajanda, tekstil, termos, çanta ve teknoloji
            promosyonlarında binlerce ürün seçeneğiyle Türkiye geneline gönderim yapıyoruz.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/urunler/"
              className="rounded-md bg-navy px-5 py-2.5 text-[13px] font-extrabold text-white hover:bg-[#0a2540]"
            >
              Promosyon Kataloğu
            </Link>
            <Link
              href="/teklif/"
              className="rounded-md border border-line bg-white px-5 py-2.5 text-[13px] font-extrabold text-navy hover:bg-soft"
            >
              Toplu Alım Teklifi
            </Link>
            <Link
              href="/logolu-siparis/"
              className="rounded-md border border-line bg-white px-5 py-2.5 text-[13px] font-extrabold text-navy hover:bg-soft"
            >
              Logolu Sipariş
            </Link>
          </div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="rounded-md border border-line bg-white p-5">
              <h2 className="text-[15px] font-extrabold text-navy">{item.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#555]">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-md border border-line bg-white p-6 sm:p-8">
          <h2 className="text-[20px] font-extrabold tracking-wide text-navy uppercase">Promosyon Kategorileri</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#555]">
            İhtiyacınıza uygun promosyon ürününü kategorilerden seçin; logolu baskı ve toplu alım için teklif alın.
          </p>
          <div className="mt-5 space-y-5">
            {categories.map((cat) => (
              <div key={cat.slug}>
                <Link
                  href={categoryPath(cat.slug)}
                  className="text-[16px] font-extrabold text-navy hover:text-orange"
                >
                  {cat.name}
                </Link>
                {cat.children.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-[#555]">
                    {cat.children.map((child) => (
                      <li key={child.slug}>
                        <Link href={categoryPath(child.slug)} className="hover:text-navy hover:underline">
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-md border border-line bg-[#fff8f0] p-6 sm:p-8">
          <h2 className="text-[18px] font-extrabold text-navy">Neden Eser Promo?</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[14px] leading-relaxed text-[#444]">
            <li>2007&apos;den bu yana promosyon ve kurumsal hediyelik tedariki</li>
            <li>Ücretsiz logo / tasarım desteği ve numune süreci</li>
            <li>UV, tampon, lazer, serigrafi ve transfer baskı seçenekleri</li>
            <li>Kurumsal fatura, toplu alım indirimi ve sipariş takibi</li>
            <li>Türkiye geneli kargo; İstanbul Anadolu Yakası ve Kocaeli hattına hızlı sevkiyat</li>
          </ul>
        </section>

        <section className="mt-6 rounded-md border border-line bg-white p-6 sm:p-8">
          <h2 className="text-[18px] font-extrabold text-navy">Bölgesel Promosyon Tedariki</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#555]">
            Merkez ofisimiz Tuzla&apos;dadır. Pendik, Gebze, Kartal, Dilovası ve çevresine promosyon sevkiyatı için
            bölge sayfalarımıza göz atın:
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {LOCAL_AREA_LINKS.map((area) => (
              <li key={area.href}>
                <Link
                  href={area.href}
                  className="inline-block rounded-md border border-line bg-soft px-3 py-1.5 text-[13px] font-semibold text-navy hover:border-navy"
                >
                  {area.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-md border border-line bg-white p-6 sm:p-8">
          <h2 className="text-[18px] font-extrabold text-navy">Sık Sorulan Promosyon Soruları</h2>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-[14px] font-extrabold text-[#111]">Promosyon ürün siparişi nasıl verilir?</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-[#555]">
                Katalogdan ürün seçip sepete ekleyebilir veya toplu alım / logolu sipariş formlarından teklif
                isteyebilirsiniz.
              </dd>
            </div>
            <div>
              <dt className="text-[14px] font-extrabold text-[#111]">Logolu promosyon minimum adet var mı?</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-[#555]">
                Ürün ve baskı tekniğine göre değişir; net bilgi için teklif formu veya WhatsApp hattımızdan ulaşın.
              </dd>
            </div>
            <div>
              <dt className="text-[14px] font-extrabold text-[#111]">Promosyon fiyatları KDV dahil mi?</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-[#555]">
                Ürün fiyatları KDV hariç gösterilir; sepet ve ödeme adımında KDV ile birlikte toplam tutar yer alır.
              </dd>
            </div>
          </dl>
          <Link href="/sss/" className="mt-4 inline-block text-[13px] font-semibold text-navy underline underline-offset-2">
            Tüm SSS
          </Link>
        </section>
      </article>
    </ShopChrome>
  );
}
