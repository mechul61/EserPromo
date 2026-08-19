import { AboutPageView } from "@/components/info/AboutPageView";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Hakkımızda",
  description:
    "Eser Promo'nun kurumsal promosyon, logolu baskı ve toplu sipariş süreçlerindeki üretim yaklaşımı ve hizmet anlayışı.",
  path: "/hakkimizda",
});

export default function Page() {
  return <AboutPageView />;
}
