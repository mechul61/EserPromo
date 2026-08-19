import { ShopChrome } from "@/components/layout/ShopChrome";
import { CatalogWhatsAppFab } from "@/components/catalog/CatalogWhatsAppFab";

export function CatalogChrome({ children }: { children: React.ReactNode }) {
  return (
    <ShopChrome extra={<CatalogWhatsAppFab />} mainClassName="pt-0 pb-5" hideNav>
      {children}
    </ShopChrome>
  );
}
