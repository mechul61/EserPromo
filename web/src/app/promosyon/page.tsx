import { PromosyonHubView } from "@/components/seo/PromosyonHubView";
import { getCategoryTree } from "@/lib/catalog";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { siteUrl } from "@/lib/env";

export const metadata = buildPageMetadata({
  title: "Promosyon | Promosyon Ürünleri ve Kurumsal Hediyelik",
  description:
    "Promosyon ürünleri, logolu kurumsal hediyelik ve toplu alım tedariki. Kalem, ajanda, tekstil, termos promosyonları. Eser Promo ile hızlı üretim ve Türkiye geneli kargo.",
  path: "/promosyon",
});

function buildPromosyonJsonLd(categoryCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Promosyon Ürünleri",
    description:
      "Promosyon ve logolu kurumsal hediye ürünleri kataloğu. Toplu alım teklifi ve hızlı tedarik.",
    url: `${siteUrl()}/promosyon/`,
    inLanguage: "tr-TR",
    about: {
      "@type": "Thing",
      name: "Promosyon ürünleri",
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: categoryCount,
      name: "Promosyon ürün kategorileri",
    },
  };
}

export default async function PromosyonPage() {
  const tree = await getCategoryTree();
  const categories = tree.map((cat) => ({
    name: cat.name,
    slug: cat.slug,
    children: cat.children.map((child) => ({ name: child.name, slug: child.slug })),
  }));

  const jsonLd = buildPromosyonJsonLd(categories.length);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PromosyonHubView categories={categories} />
    </>
  );
}
