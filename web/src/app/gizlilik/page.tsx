import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Gizlilik Politikası",
  description: INFO_PAGES.gizlilik.intro,
  path: "/gizlilik",
});

export default function Page() {
  return <InfoPageView page={INFO_PAGES.gizlilik} />;
}
