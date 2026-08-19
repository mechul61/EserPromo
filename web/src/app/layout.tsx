import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/env";
import { faviconSrc, getSiteSettings } from "@/lib/site-settings";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const icon = faviconSrc(settings);
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: settings.seo.title || settings.general.siteTitle || "Eser Promo",
      template: `%s | ${settings.general.siteName || "Eser Promo"}`,
    },
    description: settings.seo.description || settings.general.description,
    keywords: settings.seo.keywords || undefined,
    robots: settings.seo.allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
    icons: icon ? [{ url: icon }] : undefined,
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${montserrat.variable} h-full`}>
      <body className="min-h-dvh flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
