import type { InfoPageContent } from "@/data/info-pages";

export function buildFaqJsonLd(page: InfoPageContent) {
  const items = page.sections
    .filter((section) => section.heading)
    .map((section) => ({
      "@type": "Question",
      name: section.heading,
      acceptedAnswer: {
        "@type": "Answer",
        text: [
          ...(section.paragraphs ?? []),
          ...(section.bullets ?? []),
        ].join(" "),
      },
    }));

  if (items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items,
  };
}
