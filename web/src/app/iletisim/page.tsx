import Link from "next/link";
import { ChevronRight, Home, Mail, MapPin, Phone, Smartphone } from "lucide-react";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { SITE_CONTACT } from "@/data/catalog-page";
import { INFO_PAGES } from "@/data/info-pages";

export const metadata = { title: "İletişim" };

const cards = [
  {
    label: "Adres",
    value: SITE_CONTACT.address,
    href: "https://maps.google.com/?q=" + encodeURIComponent(SITE_CONTACT.address),
    Icon: MapPin,
  },
  {
    label: "Telefon",
    value: SITE_CONTACT.phone,
    href: SITE_CONTACT.phoneTel,
    Icon: Phone,
  },
  {
    label: "WhatsApp",
    value: SITE_CONTACT.whatsapp,
    href: SITE_CONTACT.whatsappHref,
    Icon: Smartphone,
  },
  {
    label: "E-posta",
    value: SITE_CONTACT.email,
    href: `mailto:${SITE_CONTACT.email}`,
    Icon: Mail,
  },
] as const;

export default function Page() {
  const page = INFO_PAGES.iletisim;

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
        <span className="text-[#555]">{page.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl">
        <div className="rounded-md border border-line bg-white p-6 sm:p-8">
          <h1 className="text-[24px] font-extrabold tracking-wide text-navy uppercase">{page.title}</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[#555]">{page.intro}</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {cards.map(({ label, value, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              className="rounded-md border border-line bg-white p-5 transition hover:border-navy"
            >
              <p className="inline-flex items-center gap-2 text-[12px] font-extrabold tracking-wide text-navy uppercase">
                <Icon className="size-4" strokeWidth={1.8} />
                {label}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#444]">{value}</p>
            </a>
          ))}
        </div>

        <p className="mt-5 text-[13px] text-[#6b7280]">
          Mesajlarınıza mesai saatleri içinde dönüş yapılır. Acil sipariş ve baskı soruları için WhatsApp hattını
          kullanmanızı öneririz.
        </p>
      </article>
    </ShopChrome>
  );
}
