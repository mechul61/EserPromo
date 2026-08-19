import { TopBar } from "@/components/layout/TopBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MainNav } from "@/components/layout/MainNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SitePopup } from "@/components/layout/SitePopup";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin";
import { getSiteSettings } from "@/lib/site-settings";

export async function ShopChrome({
  children,
  extra,
  mainClassName = "py-6",
  className = "",
  skipMaintenance = false,
  hideNav = false,
  searchQuery = "",
}: {
  children: React.ReactNode;
  extra?: React.ReactNode;
  mainClassName?: string;
  className?: string;
  skipMaintenance?: boolean;
  hideNav?: boolean;
  searchQuery?: string;
}) {
  if (!skipMaintenance) {
    const [settings, user] = await Promise.all([getSiteSettings(), getCurrentUser()]);
    if (settings.maintenance.enabled && !isAdminUser(user)) {
      return (
        <div className="grid min-h-dvh place-items-center bg-[#f5f7fb] px-6 text-center">
          <div className="max-w-lg">
            <p className="text-[12px] font-extrabold tracking-wide text-navy uppercase">Eser Promo</p>
            <h1 className="mt-3 text-[28px] font-extrabold text-[#0f172a]">{settings.maintenance.title || "Bakımdayız"}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[#64748b]">{settings.maintenance.message}</p>
          </div>
        </div>
      );
    }
  }

  return (
    <FavoritesProvider>
      <div className={`flex min-h-dvh flex-col ${className}`}>
        <TopBar />
        <SiteHeader searchQuery={searchQuery} />
        {!hideNav && (
          <div className="container-ep">
            <MainNav />
          </div>
        )}
        <main className={`container-ep flex-1 ${mainClassName}`}>{children}</main>
        <SiteFooter />
        {extra}
        <SitePopup />
      </div>
    </FavoritesProvider>
  );
}
