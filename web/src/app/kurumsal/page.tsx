import { CorporatePageView } from "@/components/info/CorporatePageView";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Kurumsal Promosyon Çözümleri",
  description:
    "Kurumsal promosyon ve logolu hediyelik tedariki. Üretim gücü, baskı teknikleri, kalite süreçleri ve marka iş birlikleri — Eser Promo.",
  path: "/kurumsal",
});

export default function Page() {
  return <CorporatePageView />;
}
