import { ShopChrome } from "@/components/layout/ShopChrome";
import { MainNav } from "@/components/layout/MainNav";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { CategorySidebar } from "@/components/home/CategorySidebar";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { CatalogProductStrip } from "@/components/home/CatalogProductStrip";
import { ProductSection } from "@/components/home/ProductSection";

export default function HomePage() {
  return (
    <ShopChrome extra={<FloatingActions />} mainClassName="pt-0 pb-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4">
        <CategorySidebar />

        <div className="min-w-0 flex-1">
          <MainNav />
          <div className="pt-4">
            <HeroBanner />
            <FeatureStrip />
            <CategoryShowcase />
            <CatalogProductStrip />
            <ProductSection />
          </div>
        </div>
      </div>
    </ShopChrome>
  );
}
