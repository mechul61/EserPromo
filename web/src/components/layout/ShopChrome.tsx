import { TopBar } from "@/components/layout/TopBar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";

export function ShopChrome({
  children,
  extra,
  mainClassName = "py-6",
  className = "",
}: {
  children: React.ReactNode;
  extra?: React.ReactNode;
  mainClassName?: string;
  className?: string;
}) {
  return (
    <FavoritesProvider>
      <div className={`flex min-h-dvh flex-col ${className}`}>
        <TopBar />
        <SiteHeader />
        <main className={`container-ep flex-1 ${mainClassName}`}>{children}</main>
        <SiteFooter />
        {extra}
      </div>
    </FavoritesProvider>
  );
}
