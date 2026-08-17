import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";

export const metadata = { title: "Sıkça Sorulan Sorular" };

export default function Page() {
  return <InfoPageView page={INFO_PAGES.sss} />;
}
