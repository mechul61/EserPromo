import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildFaqJsonLd } from "@/lib/seo/faq-schema";

export const metadata = buildPageMetadata({
  title: "Promosyon SSS | Sıkça Sorulan Sorular",
  description:
    "Promosyon siparişi, logolu baskı, kargo, ödeme ve iade süreçleri hakkında sık sorulan sorular. Eser Promo müşteri rehberi.",
  path: "/sss",
});

export default function Page() {
  const faqJsonLd = buildFaqJsonLd(INFO_PAGES.sss);

  return (
    <>
      {faqJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      ) : null}
      <InfoPageView page={INFO_PAGES.sss} />
    </>
  );
}
