import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";

export const metadata = { title: "Kargo & Teslimat" };

export default function Page() {
  return <InfoPageView page={INFO_PAGES["kargo-teslimat"]} />;
}
