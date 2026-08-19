import { ShopChrome } from "@/components/layout/ShopChrome";
import { MainNav } from "@/components/layout/MainNav";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { CategorySidebar } from "@/components/home/CategorySidebar";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { ProductSection, type HomeProduct } from "@/components/home/ProductSection";
import { prisma } from "@/lib/db";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { productPath } from "@/lib/seo/urls";

function currentTimestamp() { return Date.now(); }

export const dynamic = "force-dynamic";
export const metadata = buildPageMetadata({
  title: "Promosyon Ürünleri Tuzla | Kurumsal Hediyelik",
  description:
    "Tuzla merkezli Eser Promo: promosyon ürünleri, logolu kurumsal hediyelik, toplu alım teklifi. Pendik, Gebze, Kartal ve Anadolu Yakası'na hızlı tedarik.",
  path: "/",
});

export default async function HomePage() {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isGroupPrimary: true, showOnHomepage: true, removed: false },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: [{ stockTotal: "desc" }, { createdAt: "desc" }],
    take: 24,
  });

  const now = currentTimestamp();
  const products: HomeProduct[] = rows.map((product) => {
    const isNew = now - product.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30;
    const badge: HomeProduct["badge"] = product.discountLocked
      ? "Kampanyalı"
      : isNew
        ? "Yeni"
        : "Çok Satan";
    return {
      id: product.id,
      href: productPath(product.slug),
      code: product.sku,
      name: product.title || product.name,
      image: mediaUrl(product.images[0]?.localPath) ?? "/brand/logo.png",
      price: formatPriceTry(Number(product.price)),
      inStock: product.stockTotal > 0,
      stock: product.stockTotal,
      badge,
    };
  });

  return (
    <ShopChrome extra={<FloatingActions />} mainClassName="pt-0 pb-5" hideNav>
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4">
        <CategorySidebar />

        <div className="min-w-0 flex-1">
          <MainNav />
          <div className="pt-4">
            <HeroBanner />
            <FeatureStrip />
            <CategoryShowcase />
            <ProductSection products={products} />
          </div>
        </div>
      </div>
    </ShopChrome>
  );
}
