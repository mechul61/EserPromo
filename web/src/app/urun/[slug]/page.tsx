import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { AddToCartButton } from "@/components/commerce/AddToCartButton";
import { getVariantSiblings, resolveProduct } from "@/lib/catalog";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { canonicalPath, categoryPath, productPath } from "@/lib/seo/urls";
import { siteUrl } from "@/lib/env";

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
      p.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
      `${title} logolu promosyon ürünü.`,
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
  const mainImage = mediaUrl(product.images[0]?.localPath) ?? "/brand/logo.png";
  const inStock = product.stockTotal > 0;
  const heading = product.title || product.name;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: heading,
    sku: product.sku,
    description: product.description || undefined,
    image: mainImage.startsWith("http") ? mainImage : `${siteUrl()}${mainImage}`,
    brand: { "@type": "Brand", name: "Eser Promo" },
    offers: {
      "@type": "Offer",
      url: canonicalPath(productPath(product.slug)),
      priceCurrency: "TRY",
      price: Number(product.price).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <ShopChrome>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="mb-5 flex flex-wrap items-center gap-1 text-[13px] text-[#6b7280]">
        <Link href="/" className="hover:text-navy">
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={categoryPath(product.category.slug)} className="hover:text-navy">
          {product.category.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-navy">{heading}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
          <div className="relative mx-auto aspect-square max-w-[480px]">
            <Image
              src={mainImage}
              alt={heading}
              fill
              unoptimized
              className="object-contain"
              sizes="480px"
              priority
            />
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-[#6b7280]">
            Kod: <span className="text-navy">{product.sku}</span>
          </p>
          <h1 className="mt-2 text-[28px] leading-tight font-extrabold text-navy sm:text-[32px]">
            {heading}
          </h1>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <p className="text-[30px] font-extrabold text-[#111]">
              ₺{formatPriceTry(product.price)}
              <span className="ml-2 text-[14px] font-semibold text-[#6b7280]">
                + KDV %{Number(product.vatRate)}
              </span>
            </p>
            <p
              className={`flex items-center gap-1.5 text-[14px] font-bold ${
                inStock ? "text-brand-green" : "text-brand-red"
              }`}
            >
              <Check className="size-4" strokeWidth={3} />
              {inStock
                ? `Stokta (${product.stockTotal.toLocaleString("tr-TR")} adet)`
                : "Stok yok"}
            </p>
          </div>

          {variants.length > 1 ? (
            <div className="mt-6">
              <p className="text-[13px] font-bold text-navy">Renk / Varyant</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {variants.map((s) => {
                  const active = s.id === product.id;
                  const thumb = mediaUrl(s.images[0]?.localPath);
                  return (
                    <Link
                      key={s.id}
                      href={productPath(s.slug)}
                      className={`flex min-w-[88px] flex-col items-center gap-1 rounded-lg border px-2 py-2 text-center text-[12px] font-semibold transition ${
                        active
                          ? "border-navy bg-navy text-white"
                          : "border-line bg-white text-navy hover:border-navy/40"
                      }`}
                    >
                      {thumb ? (
                        <span className="relative size-10 overflow-hidden rounded bg-[#f7f8fa]">
                          <Image
                            src={thumb}
                            alt={s.color || s.sku}
                            fill
                            unoptimized
                            className="object-contain p-0.5"
                          />
                        </span>
                      ) : null}
                      {s.color || s.sku}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : product.color ? (
            <p className="mt-4 text-[14px] text-[#374151]">
              <span className="font-bold text-navy">Renk:</span> {product.color}
            </p>
          ) : null}

          {product.description ? (
            <div className="mt-6 rounded-lg bg-soft p-4 text-[14px] leading-relaxed text-[#374151] whitespace-pre-wrap">
              {product.description}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-start gap-3">
            {inStock ? <AddToCartButton productId={product.id} /> : null}
            <Link
              href={categoryPath(product.category.slug)}
              className="inline-flex items-center justify-center rounded-md border border-line bg-white px-6 py-3 text-[14px] font-semibold text-navy hover:bg-soft"
            >
              {product.category.name}
            </Link>
          </div>
        </div>
      </div>
    </ShopChrome>
  );
}
