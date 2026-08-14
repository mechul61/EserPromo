import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { CatalogChrome } from "@/components/catalog/CatalogChrome";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { ProductStage } from "@/components/product/ProductStage";
import { ProductTabs } from "@/components/product/ProductTabs";
import { ProductTrustBar } from "@/components/product/ProductTrustBar";
import { MainNav } from "@/components/layout/MainNav";
import { getVariantSiblings, resolveProduct } from "@/lib/catalog";
import { mediaUrl, formatPriceTry, formatStock } from "@/lib/media";
import { colorToHex, grossPrice, parseProductCopy, stripHtml } from "@/lib/product-detail";
import { canonicalPath, categoryPath, productPath } from "@/lib/seo/urls";
import { siteUrl } from "@/lib/env";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await resolveProduct(slug);
  if (!resolved) return { title: "Ürün bulunamadı" };
  if (resolved.kind === "redirect") return { title: "Yönlendiriliyor" };
  const p = resolved.product;
  const title = p.title || p.name;
  return {
    title,
    description:
      stripHtml(p.description).slice(0, 160) || `${title} logolu promosyon ürünü.`,
    alternates: { canonical: canonicalPath(productPath(p.slug)) },
    openGraph: {
      title,
      url: canonicalPath(productPath(p.slug)),
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = await resolveProduct(slug);
  if (!resolved) notFound();
  if (resolved.kind === "redirect") {
    permanentRedirect(productPath(resolved.to));
  }

  const product = resolved.product;
  const variants = await getVariantSiblings(product.skuGroup);
  const images = product.images
    .map((img) => mediaUrl(img.localPath))
    .filter((src): src is string => Boolean(src));
  const inStock = product.stockTotal > 0;
  const heading = product.title || product.name;
  const vat = Number(product.vatRate);
  const unitGross = grossPrice(Number(product.price), vat);
  const isNew = Date.now() - product.createdAt.getTime() < 1000 * 60 * 60 * 24 * 30;
  const copy = parseProductCopy(product.description, product.features);

  let parentName: string | null = null;
  if (product.category.parentId) {
    try {
      const parent = await prisma.category.findUnique({
        where: { id: product.category.parentId },
      });
      parentName = parent?.name ?? null;
    } catch {
      parentName = null;
    }
  }

  const specs = [
    { label: "Renk", value: product.color },
    { label: "Ebat", value: product.size },
    { label: "Stok", value: formatStock(product.stockTotal) },
  ].filter((row) => row.value) as Array<{ label: string; value: string }>;

  const colors = (variants.length > 0 ? variants : [product]).map((item) => ({
    name: item.color || item.sku,
    hex: colorToHex(item.color || item.sku),
    href: productPath(item.slug),
    active: item.id === product.id,
  }));

  const others = variants.filter((item) => item.id !== product.id);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: heading,
    sku: product.sku,
    description: stripHtml(product.description) || undefined,
    image: images[0]
      ? images[0].startsWith("http")
        ? images[0]
        : `${siteUrl()}${images[0]}`
      : undefined,
    brand: { "@type": "Brand", name: "Eser Promo" },
    offers: {
      "@type": "Offer",
      url: canonicalPath(productPath(product.slug)),
      priceCurrency: "TRY",
      price: unitGross.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <CatalogChrome>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-4">
        <CatalogSidebar
          activeSlug={product.category.slug}
          heading="TÜM KATEGORİLER"
          showPromo={false}
        />

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
              {parentName ? (
                <>
                  <ChevronRight className="size-3" />
                  <span>{parentName}</span>
                </>
              ) : null}
              <ChevronRight className="size-3" />
              <Link href={categoryPath(product.category.slug)} className="hover:text-navy">
                {product.category.name}
              </Link>
              <ChevronRight className="size-3" />
              <span className="text-[#555]">{heading}</span>
            </nav>

            <ProductStage
              productId={product.id}
              heading={heading}
              sku={product.sku}
              images={images}
              isNew={isNew}
              inStock={inStock}
              stock={product.stockTotal}
              unitPrice={unitGross}
              specs={specs}
              colors={colors}
            />

            <ProductTrustBar />

            <ProductTabs
              sku={product.sku}
              heading={heading}
              description={copy.prose}
              features={copy.features}
              printArea={copy.printNotes.join("\n")}
              others={others.map((item) => ({
                href: productPath(item.slug),
                image: mediaUrl(item.images[0]?.localPath) ?? "/brand/logo.png",
                name: item.color || item.sku,
                price: formatPriceTry(grossPrice(Number(item.price), Number(item.vatRate))),
              }))}
            />
          </div>
        </div>
      </div>
    </CatalogChrome>
  );
}
