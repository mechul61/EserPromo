import { notFound } from "next/navigation";
import { LocalAreaPageView } from "@/components/seo/LocalAreaPageView";
import { buildLocalAreaJsonLd } from "@/lib/seo/local-business";
import { getLocalArea, LOCAL_AREAS } from "@/lib/seo/local-areas";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return LOCAL_AREAS.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const area = getLocalArea(slug);
  if (!area) return { title: "Bölge bulunamadı" };
  return buildPageMetadata({
    title: area.title,
    description: area.metaDescription,
    path: `/bolgeler/${area.slug}`,
  });
}

export default async function LocalAreaPage({ params }: PageProps) {
  const { slug } = await params;
  const area = getLocalArea(slug);
  if (!area) notFound();

  const jsonLd = buildLocalAreaJsonLd(area);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LocalAreaPageView area={area} />
    </>
  );
}
