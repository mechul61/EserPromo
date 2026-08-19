import Link from "next/link";
import { Mail, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { FooterNewsletter } from "@/components/layout/FooterNewsletter";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { getSiteContact, getSiteSettings } from "@/lib/site-settings";
import { FOOTER_COLS } from "@/data/info-pages";

function PaymentMarks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-white/85">
      <span className="text-[15px] font-extrabold italic tracking-wide">VISA</span>
      <svg viewBox="0 0 40 24" className="h-5 w-8" aria-label="Mastercard">
        <circle cx="15" cy="12" r="8" fill="#eb001b" opacity="0.95" />
        <circle cx="25" cy="12" r="8" fill="#f79e1b" opacity="0.95" />
        <path d="M20 6.4a8 8 0 0 1 0 11.2 8 8 0 0 1 0-11.2Z" fill="#ff5f00" />
      </svg>
      <span className="text-[14px] font-bold tracking-tight">troy</span>
      <span className="text-[14px] font-semibold tracking-tight">iyzico</span>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h4 className="text-[13px] font-extrabold tracking-wide text-white">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-[13px] text-white/70">
        {links.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter() {
  const [contact, settings] = await Promise.all([getSiteContact(), getSiteSettings()]);
  const socials = [
    { name: "Instagram", href: settings.socialMedia.instagram },
    { name: "Facebook", href: settings.socialMedia.facebook },
    { name: "X", href: settings.socialMedia.twitter },
    { name: "LinkedIn", href: settings.socialMedia.linkedin },
    { name: "YouTube", href: settings.socialMedia.youtube },
    { name: "TikTok", href: settings.socialMedia.tiktok },
  ].filter((item) => item.href.trim());

  return (
    <footer className="mt-auto bg-[#001b31] text-white">
      <div className="container-ep grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.15fr_0.9fr_1.05fr_1fr_1.2fr_1.15fr] xl:gap-8">
        <div>
          <Link href="/" className="text-[26px] leading-none font-extrabold tracking-tight text-white">
            eser<span className="font-medium">Promo</span>
          </Link>
          <p className="mt-4 max-w-[240px] text-[13px] leading-relaxed text-white/70">
            {settings.general.description || "Promosyon ürünlerinde kaliteli, hızlı ve güvenilir çözümler sunuyoruz."}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {socials.slice(0, 3).map((item) => (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.name}
                className="flex size-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold"
              >
                {item.name.slice(0, 2)}
              </a>
            ))}
            <a
              href={contact.whatsappHref}
              aria-label="WhatsApp"
              className="flex size-8 items-center justify-center rounded-full bg-[#25D366] text-white"
            >
              <WhatsAppIcon className="size-4" />
            </a>
          </div>
        </div>

        <FooterCol title="KURUMSAL" links={[...FOOTER_COLS.kurumsal]} />
        <FooterCol title="MÜŞTERİ HİZMETLERİ" links={[...FOOTER_COLS.hizmetler]} />
        <FooterCol title="BİLGİLENDİRME" links={[...FOOTER_COLS.bilgilendirme]} />

        <div>
          <h4 className="text-[13px] font-extrabold tracking-wide text-white">İLETİŞİM</h4>
          <ul className="mt-4 space-y-3 text-[13px] text-white/70">
            <li className="leading-relaxed">{contact.address}</li>
            <li>
              <a href={contact.phoneTel} className="inline-flex items-center gap-2 hover:text-white">
                <Phone className="size-4 shrink-0" strokeWidth={1.75} />
                {contact.phone}
              </a>
            </li>
            <li>
              <a href={contact.whatsappHref} className="inline-flex items-center gap-2 hover:text-white">
                <Smartphone className="size-4 shrink-0" strokeWidth={1.75} />
                {contact.whatsapp}
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 hover:text-white">
                <Mail className="size-4 shrink-0" strokeWidth={1.75} />
                {contact.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-[13px] font-extrabold tracking-wide text-white">E-BÜLTEN</h4>
          <p className="mt-4 text-[13px] text-white/70">Kampanya ve yeniliklerden haberdar olun!</p>
          <FooterNewsletter />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-ep flex flex-col items-center gap-3 py-4 text-[12px] text-white/60 lg:flex-row lg:justify-between">
          <p>© {new Date().getFullYear()} {settings.general.siteName || "EserPromo"}. Tüm hakları saklıdır.</p>
          <PaymentMarks />
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-white/75" strokeWidth={1.75} />
            256 Bit SSL Güvenli Alışveriş
          </p>
        </div>
      </div>
    </footer>
  );
}
