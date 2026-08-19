import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Çerez Politikası",
  description: INFO_PAGES.cerez.intro,
  path: "/cerez-politikasi",
});

export default function Page() {
  return <InfoPageView page={INFO_PAGES.cerez} />;
}
