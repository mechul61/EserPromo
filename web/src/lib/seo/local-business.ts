import { SITE_CONTACT } from "@/data/catalog-page";
import { siteUrl } from "@/lib/env";
import { LOCAL_SERVICE_AREAS } from "@/lib/seo/local-areas";

type Contact = {
  phone: string;
  phoneTel: string;
  email: string;
  address: string;
  whatsapp: string;
  whatsappHref: string;
  mapsUrl: string;
};

/** Tuzla / Aydıntepe merkez koordinatları */
const GEO = {
  latitude: 40.8504,
  longitude: 29.3168,
};

export function buildLocalBusinessJsonLd(
  contact: Contact,
  siteName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl()}/#localbusiness`,
    name: siteName || "Eser Promo",
    description:
      "Promosyon ürünleri, kurumsal hediyelik, logolu baskı ve toplu alım tedarikçisi. Türkiye geneli gönderim; Tuzla merkezli üretim.",
    url: siteUrl(),
    logo: `${siteUrl()}/brand/logo.png`,
    image: `${siteUrl()}/brand/logo.png`,
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Aydıntepe Mah. Harmandalı Sk. No:24",
      addressLocality: "Tuzla",
      addressRegion: "İstanbul",
      postalCode: "34947",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: GEO.latitude,
      longitude: GEO.longitude,
    },
    areaServed: LOCAL_SERVICE_AREAS.map((name) => ({
      "@type": "City",
      name,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: name === "Gebze" || name === "Dilovası" || name === "Çayırova" ? "Kocaeli" : "İstanbul",
      },
    })),
    priceRange: "₺₺",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    sameAs: contact.mapsUrl ? [contact.mapsUrl] : undefined,
  };
}

export function buildWebsiteSearchJsonLd(siteName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName || "Eser Promo",
    alternateName: ["Eser Promosyon", "Promosyon Ürünleri"],
    url: siteUrl(),
    inLanguage: "tr-TR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl()}/arama/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildLocalAreaJsonLd(area: {
  title: string;
  metaDescription: string;
  slug: string;
  name: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: area.title,
    description: area.metaDescription,
    url: `${siteUrl()}/bolgeler/${area.slug}/`,
    about: {
      "@type": "Service",
      name: `${area.name} promosyon ürünleri tedariki`,
      provider: { "@id": `${siteUrl()}/#localbusiness` },
      areaServed: area.name,
    },
  };
}

export function defaultLocalAddressLine() {
  return SITE_CONTACT.address;
}
