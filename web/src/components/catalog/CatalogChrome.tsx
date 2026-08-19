import { ShopChrome } from "@/components/layout/ShopChrome";
import { CatalogWhatsAppFab } from "@/components/catalog/CatalogWhatsAppFab";

export function CatalogChrome({
  children,
  searchQuery,
}: {
  children: React.ReactNode;
  searchQuery?: string;
}) {
  return (
    <ShopChrome
      extra={<CatalogWhatsAppFab />}
      mainClassName="pt-0 pb-5"
      hideNav
      searchQuery={searchQuery}
    >
      {children}
    </ShopChrome>
  );
}
