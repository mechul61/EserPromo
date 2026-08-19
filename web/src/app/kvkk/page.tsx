import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "KVKK Aydınlatma Metni",
  description: INFO_PAGES.kvkk.intro,
  path: "/kvkk",
});

export default function Page() {
  return <InfoPageView page={INFO_PAGES.kvkk} />;
}
