import { SiteSettingsPageView } from "@/components/admin/SiteSettingsPageView";
import { getSiteSettings, logoSrc, faviconSrc } from "@/lib/site-settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Ayarları | Yönetim" };

export default async function AdminSiteSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <SiteSettingsPageView
      initial={settings}
      logoPreview={logoSrc(settings)}
      faviconPreview={faviconSrc(settings) || "/favicon.ico"}
    />
  );
}
