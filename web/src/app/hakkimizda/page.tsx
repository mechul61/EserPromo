import { AboutPageView } from "@/components/info/AboutPageView";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Hakkımızda",
  description:
    "Tuzla merkezli Eser Promo: promosyon ürünleri, logolu baskı ve kurumsal hediyelik tedarikçisi. Pendik, Gebze ve Anadolu Yakası'na hizmet.",
  path: "/hakkimizda",
});

export default function Page() {
  return <AboutPageView />;
}
