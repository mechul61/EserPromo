import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Bayilik",
  description: INFO_PAGES.bayilik.intro,
  path: "/bayilik",
});

export default function Page() {
  return <InfoPageView page={INFO_PAGES.bayilik} />;
}
