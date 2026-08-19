import { AboutPageView } from "@/components/info/AboutPageView";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Hakkımızda | Promosyon Ürünleri Tedarikçisi",
  description:
    "Promosyon ürünleri ve logolu kurumsal hediyelik tedarikçisi Eser Promo. Tuzla merkezli üretim; Pendik, Gebze ve Türkiye geneline hizmet.",
  path: "/hakkimizda",
});

export default function Page() {
  return <AboutPageView />;
}
