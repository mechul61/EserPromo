import { PrintTechniquesPageView } from "@/components/info/PrintTechniquesPageView";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Baskı Tekniklerimiz",
  description:
    "UV, tampon, lazer, folyo ve diğer baskı teknikleriyle ürünlerinize uygulanabilecek logolama yöntemlerini karşılaştırın.",
  path: "/baski-teknikleri",
});

export default function Page() {
  return <PrintTechniquesPageView />;
}
