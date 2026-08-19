import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "İade & Değişim",
  description: INFO_PAGES["iade-degisim"].intro,
  path: "/iade-degisim",
});

export default function Page() {
  return <InfoPageView page={INFO_PAGES["iade-degisim"]} />;
}
