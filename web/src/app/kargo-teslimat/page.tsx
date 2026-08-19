import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Kargo & Teslimat",
  description: INFO_PAGES["kargo-teslimat"].intro,
  path: "/kargo-teslimat",
});

export default function Page() {
  return <InfoPageView page={INFO_PAGES["kargo-teslimat"]} />;
}
