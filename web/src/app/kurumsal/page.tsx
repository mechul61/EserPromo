import { CorporatePageView } from "@/components/info/CorporatePageView";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Kurumsal",
  description:
    "Eser Promo kurumsal sayfasında üretim gücümüz, kalite yaklaşımımız, marka iş birliklerimiz ve hizmet süreçlerimizi inceleyin.",
  path: "/kurumsal",
});

export default function Page() {
  return <CorporatePageView />;
}
