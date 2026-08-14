import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/env";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Eser Promo | Promosyon Ürünleri",
    template: "%s | Eser Promo",
  },
  description:
    "Logo baskılı promosyon ürünleri, kurumsal hediyelik ve toplu alım çözümleri.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${montserrat.variable} h-full`}>
      <body className="min-h-dvh flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
