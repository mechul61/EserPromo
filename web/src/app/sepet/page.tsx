import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { CatalogChrome } from "@/components/catalog/CatalogChrome";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { CartView, type CartLineView } from "@/components/commerce/CartView";
import { MainNav } from "@/components/layout/MainNav";
import { getCart } from "@/lib/commerce/cart";
import { mediaUrl } from "@/lib/media";
import { productPath } from "@/lib/seo/urls";

export const metadata = {
  title: "Sepetim",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const cart = await getCart();

  const items: CartLineView[] = (cart?.items ?? []).map((item) => ({
    productId: item.productId,
    href: productPath(item.product.slug),
    name: item.product.title || item.product.name,
    sku: item.product.sku,
    color: item.product.color,
    size: item.product.size,
    image: mediaUrl(item.product.images[0]?.localPath) ?? "/brand/logo.png",
    unitNet: Number(item.product.price),
    vatRate: Number(item.product.vatRate),
    quantity: item.quantity,
    stock: item.product.stockTotal,
  }));

  return (
    <CatalogChrome>
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4">
        <CatalogSidebar heading="TÜM KATEGORİLER" showPromo={false} />

        <div className="min-w-0 flex-1">
          <MainNav />

          <div className="pt-4">
            <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
              <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
                <Home className="size-3.5" />
              </Link>
              <ChevronRight className="size-3" />
              <Link href="/" className="hover:text-navy">
                Ana Sayfa
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-[#555]">Sepetim</span>
            </nav>

            <CartView items={items} />
          </div>
        </div>
      </div>
    </CatalogChrome>
  );
}
