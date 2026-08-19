import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Kariyer",
  description: INFO_PAGES.kariyer.intro,
  path: "/kariyer",
});

export default function Page() {
  return <InfoPageView page={INFO_PAGES.kariyer} />;
}
