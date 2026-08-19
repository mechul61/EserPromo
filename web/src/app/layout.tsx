import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/env";
import { buildLocalBusinessJsonLd, buildWebsiteSearchJsonLd } from "@/lib/seo/local-business";
import { faviconSrc, getSiteContact, getSiteSettings } from "@/lib/site-settings";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const icon = faviconSrc(settings);
  const title = settings.seo.title || settings.general.siteTitle || "Eser Promo";
  const description = settings.seo.description || settings.general.description;
  const image = `${siteUrl()}/brand/logo.png`;
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: title,
      template: `%s | ${settings.general.siteName || "Eser Promo"}`,
    },
    description,
    keywords: settings.seo.keywords || undefined,
    robots: settings.seo.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    icons: icon ? [{ url: icon }] : undefined,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url: siteUrl(),
      siteName: settings.general.siteName || "Eser Promo",
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, contact] = await Promise.all([getSiteSettings(), getSiteContact()]);
  const siteName = settings.general.siteName || "Eser Promo";
  const socialUrls = Object.values(settings.socialMedia)
    .map((value) => value.trim())
    .filter((value) => value.startsWith("http"));
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl(),
    logo: `${siteUrl()}/brand/logo.png`,
    sameAs: socialUrls.length > 0 ? socialUrls : undefined,
  };
  const websiteJsonLd = buildWebsiteSearchJsonLd(siteName);
  const localBusinessJsonLd = buildLocalBusinessJsonLd(contact, siteName);
  return (
    <html lang="tr" className={`${montserrat.variable} h-full`}>
      <body className="min-h-dvh flex flex-col font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
