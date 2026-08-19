import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Sıkça Sorulan Sorular",
  description: INFO_PAGES.sss.intro,
  path: "/sss",
});

export default function Page() {
  return <InfoPageView page={INFO_PAGES.sss} />;
}
