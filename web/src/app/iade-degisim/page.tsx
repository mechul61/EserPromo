import { InfoPageView } from "@/components/info/InfoPageView";
import { INFO_PAGES } from "@/data/info-pages";

export const metadata = { title: "İade & Değişim" };

export default function Page() {
  return <InfoPageView page={INFO_PAGES["iade-degisim"]} />;
}
