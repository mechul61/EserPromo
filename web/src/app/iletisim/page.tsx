import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  Home,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Smartphone,
} from "lucide-react";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { ContactForm } from "@/components/commerce/ContactForm";
import { INFO_PAGES } from "@/data/info-pages";
import { getCurrentUser } from "@/lib/auth/session";
import { isRecaptchaEnabled, recaptchaSiteKeyForClient } from "@/lib/security/recaptcha";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteContact } from "@/lib/site-settings";

export const metadata = buildPageMetadata({
  title: "İletişim",
  description:
    "Eser Promo iletişim sayfasından teklif, sipariş, baskı ve teslimat sorularınız için telefon, WhatsApp ve e-posta kanallarına ulaşın.",
  path: "/iletisim",
});

const FAQ = [
  {
    q: "Siparişim ne zaman kargoya verilir?",
    a: "Standart ürünlerde 1-3 iş günü, baskılı ürünlerde 3-7 iş günü içinde kargoya teslim edilir.",
  },
  {
    q: "Toplu alım / kurumsal teklif nasıl alabilirim?",
    a: "İletişim formunu doldurarak veya WhatsApp hattımızdan talebinizi iletebilirsiniz.",
  },
  {
    q: "Ürünlerinize logo baskısı yapıyor musunuz?",
    a: "Evet, UV baskı, lazer, tampon baskı ve folyo gibi birçok teknikle logolu baskı yapıyoruz.",
  },
];

export default async function Page() {
  const page = INFO_PAGES.iletisim;
  const [user, recaptchaEnabled, contact] = await Promise.all([
    getCurrentUser(),
    isRecaptchaEnabled(),
    getSiteContact(),
  ]);
  const recaptchaSiteKey = recaptchaSiteKeyForClient();

  const mapsUrl =
    contact.mapsUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(contact.address)}`;

  // Google Maps bağlantıları çok farklı formatlarda gelebileceği için
  // embed URL'sini sabit ve güvenli q parametresi ile üretiyoruz.
  const mapQuery = contact.address || "Eser Promo";
  const mapsEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;

  const cards = [
    {
      label: "Adres",
      value: contact.address,
      sub: (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold text-[#2563eb] hover:underline"
        >
          Yol tarifi al <ExternalLink className="size-3" />
        </a>
      ),
      Icon: MapPin,
      color: "bg-[#2563eb]",
    },
    {
      label: "Telefon",
      value: contact.phone,
      sub: null,
      Icon: Phone,
      color: "bg-[#059669]",
    },
    {
      label: "WhatsApp",
      value: contact.whatsapp,
      sub: (
        <a
          href={contact.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-bold text-[#25d366] hover:underline"
        >
          WhatsApp ile yazın <ExternalLink className="size-3" />
        </a>
      ),
      Icon: Smartphone,
      color: "bg-[#25d366]",
    },
    {
      label: "E-posta",
      value: contact.email,
      sub: (
        <span className="mt-1 block text-[11px] text-[#94a3b8]">7/24 e-posta ile destek</span>
      ),
      Icon: Mail,
      color: "bg-[#6366f1]",
    },
  ] as const;

  return (
    <ShopChrome>
      {/* BREADCRUMB */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
        <Link
          href="/"
          className="inline-flex items-center hover:text-navy"
          aria-label="Ana Sayfa"
        >
          <Home className="size-3.5" />
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/" className="hover:text-navy">
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-[#555]">{page.title}</span>
      </nav>

      {/* BAŞLIK */}
      <div className="text-center">
        <h1 className="text-[26px] font-extrabold tracking-[0.04em] text-navy uppercase sm:text-[30px]">
          İLETİŞİM
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-[13.5px] leading-relaxed text-[#6b7280]">
          Sipariş, teklif, baskı ve teslimat sorularınız için bize ulaşabilirsiniz.
        </p>
      </div>

      {/* 4 KART */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, sub, Icon, color }) => (
          <div
            key={label}
            className="flex items-start gap-3.5 rounded-xl border border-[#eceff3] bg-white px-4 py-4"
          >
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-full text-white ${color}`}
            >
              <Icon className="size-[18px]" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-extrabold tracking-wide text-navy uppercase">
                {label}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-[#334155]">{value}</p>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* FORM + HARİTA */}
      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* SOL: FORM */}
        <section className="rounded-xl border border-[#eceff3] bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-[16px] font-extrabold tracking-wide text-navy uppercase">
            <MessageSquare className="size-4.5" strokeWidth={2.2} />
            Bize Ulaşın
          </h2>
          <p className="mt-1.5 text-[12px] text-[#6b7280]">
            Aşağıdaki formu doldurarak bize hızlıca ulaşabilirsiniz.
          </p>
          <ContactForm
            recaptchaEnabled={recaptchaEnabled}
            recaptchaSiteKey={recaptchaSiteKey}
            defaultName={user?.name ?? ""}
            defaultEmail={user?.email ?? ""}
          />
        </section>

        {/* SAĞ: HARİTA */}
        <section className="rounded-xl border border-[#eceff3] bg-white p-5 sm:p-6">
          <h2 className="text-[16px] font-extrabold tracking-wide text-navy uppercase">
            Konumumuz
          </h2>
          <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#e5e7eb]">
            <iframe
              title="Eser Promo Konum"
              src={mapsEmbed}
              className="absolute inset-0 size-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </div>

      {/* SSS */}
      <section className="mt-6 rounded-xl border border-[#eceff3] bg-white p-5 sm:p-6">
        <h2 className="text-[14px] font-extrabold tracking-wide text-navy uppercase">
          Sık Sorulan Sorular
        </h2>
        <div className="mt-3 divide-y divide-[#f1f5f9]">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="flex cursor-pointer items-center justify-between text-[13px] font-semibold text-[#334155]">
                {item.q}
                <Plus className="size-4 shrink-0 text-[#94a3b8] transition group-open:rotate-45" />
              </summary>
              <p className="mt-2 text-[12px] leading-relaxed text-[#6b7280]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ALT MESAJ */}
      <p className="mt-5 mb-2 text-center text-[13px] text-[#6b7280]">
        Tüm soru ve talepleriniz için bize dilediğiniz kanaldan ulaşabilirsiniz.
      </p>
    </ShopChrome>
  );
}
