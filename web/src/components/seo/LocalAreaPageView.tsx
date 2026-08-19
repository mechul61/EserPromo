import Link from "next/link";
import { ChevronRight, Home, MapPin, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { ShopChrome } from "@/components/layout/ShopChrome";
import type { LocalArea } from "@/lib/seo/local-areas";
import { LOCAL_AREAS, localAreaPath } from "@/lib/seo/local-areas";
import { getSiteContact } from "@/lib/site-settings";

export async function LocalAreaPageView({ area }: { area: LocalArea }) {
  const contact = await getSiteContact();
  const others = area.nearby
    .map((name) => LOCAL_AREAS.find((row) => row.name === name))
    .filter((row): row is LocalArea => Boolean(row))
    .map((row) => ({ href: localAreaPath(row.slug), label: `${row.name} promosyon` }));

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
        <span className="text-[#555]">{area.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl">
        <h1 className="text-[26px] font-extrabold tracking-wide text-navy uppercase sm:text-[30px]">
          {area.title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#555]">{area.intro}</p>

        <ul className="mt-6 space-y-2 rounded-md border border-line bg-white p-5 text-[14px] text-[#444]">
          {area.highlights.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-navy" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/urunler/"
            className="flex h-12 items-center justify-center rounded-md bg-navy text-[13px] font-extrabold tracking-wide text-white hover:bg-navy-deep"
          >
            ÜRÜN KATALOĞU
          </Link>
          <Link
            href="/teklif/"
            className="flex h-12 items-center justify-center rounded-md bg-orange text-[13px] font-extrabold tracking-wide text-navy hover:bg-orange-hover"
          >
            TOPLU ALIM TEKLİFİ
          </Link>
          <Link
            href="/logolu-siparis/"
            className="flex h-12 items-center justify-center rounded-md border border-line bg-white text-[13px] font-extrabold text-navy hover:bg-soft"
          >
            LOGOLU SİPARİŞ
          </Link>
          <Link
            href="/iletisim/"
            className="flex h-12 items-center justify-center rounded-md border border-line bg-white text-[13px] font-extrabold text-navy hover:bg-soft"
          >
            İLETİŞİM
          </Link>
        </div>

        <section className="mt-8 rounded-md border border-line bg-white p-5">
          <h2 className="text-[15px] font-extrabold tracking-wide text-navy uppercase">
            Tuzla Merkez — {area.name} Teslimat
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#555]">
            Merkez ofisimiz Tuzla&apos;dadır; {area.name} ve çevresine promosyon ürünleri, logolu baskı ve
            kurumsal hediyelik sevkiyatı yapıyoruz.
          </p>
          <ul className="mt-4 space-y-2 text-[14px] text-[#444]">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-navy" />
              {contact.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0 text-navy" />
              <a href={contact.phoneTel} className="font-semibold hover:text-navy">
                {contact.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <WhatsAppIcon className="size-4 shrink-0" />
              <a href={contact.whatsappHref} className="font-semibold hover:text-navy">
                {contact.whatsapp}
              </a>
            </li>
          </ul>
        </section>

        {others.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-[14px] font-extrabold tracking-wide text-navy uppercase">Yakın Bölgeler</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {others.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[12px] font-semibold text-[#555] hover:border-navy hover:text-navy"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </ShopChrome>
  );
}
