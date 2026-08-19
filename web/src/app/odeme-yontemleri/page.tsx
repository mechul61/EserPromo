import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Ödeme Yöntemleri",
  description: INFO_PAGES["odeme-yontemleri"].intro,
  path: "/odeme-yontemleri",
});

export default function Page() {
  return <InfoPageView page={INFO_PAGES["odeme-yontemleri"]} />;
}
