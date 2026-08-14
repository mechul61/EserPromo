import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { productPath } from "@/lib/seo/urls";

/** DB'deki gerçek katalog ürünleri (sync/import sonrası). */
export async function CatalogProductStrip() {
  const products = await prisma.product.findMany({
    where: { isActive: true, isGroupPrimary: true },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: true,
      group: true,
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 12,
  });

  if (!products.length) return null;

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-3 border-b border-[#e8eaee] pb-3">
        <div>
          <h2 className="text-[18px] font-extrabold text-navy">Katalogdan</h2>
          <p className="text-[13px] text-[#6b7280]">
            Etkin API’den senkron edilen ürünler
          </p>
        </div>
        <Link
          href={productPath(products[0].slug)}
          className="text-[13px] font-medium text-[#6b7280] hover:text-navy"
        >
          İlk ürüne git →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {products.map((product) => {
          const img = mediaUrl(product.images[0]?.localPath) ?? "/brand/logo.png";
          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-xl border border-[#e8eaee] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Link href={productPath(product.slug)} className="block">
                <div className="relative mx-auto aspect-square w-full max-w-[180px] bg-[#fafbfc]">
                  <Image
                    src={img}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-contain p-4"
                    sizes="180px"
                  />
                </div>
                <div className="space-y-2 p-3 pt-1">
                  <p className="text-[11px] text-[#9ca3af]">Kod: {product.sku}</p>
                  <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-bold text-[#1a1a1a]">
                    {product.name}
                    {product.color ? ` — ${product.color}` : ""}
                  </h3>
                  <div className="flex items-end justify-between gap-2">
                    <p className="text-[16px] font-extrabold text-[#1a1a1a]">
                      ₺{formatPriceTry(product.price)}
                    </p>
                    <p className="flex items-center gap-1 text-[12px] font-semibold text-[#1f9d55]">
                      <Check className="size-3.5" strokeWidth={3} />
                      Stokta
                    </p>
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
