import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { prisma } from "@/lib/db";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { canonicalPath, categoryPath, productPath } from "@/lib/seo/urls";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Kategori bulunamadı" };
  return {
    title: category.name,
    description:
      category.description?.replace(/<[^>]+>/g, "").slice(0, 160) ||
      `${category.name} promosyon ürünleri.`,
    alternates: { canonical: canonicalPath(categoryPath(category.slug)) },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return (
    <ShopChrome>
      <h1 className="text-[28px] font-extrabold text-navy">{category.name}</h1>
      {category.description ? (
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-[#4b5563]">
          {category.description.replace(/<[^>]+>/g, " ")}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {products.map((product) => {
          const img = mediaUrl(product.images[0]?.localPath) ?? "/brand/logo.png";
          const title = product.title || product.name;
          return (
            <Link
              key={product.id}
              href={productPath(product.slug)}
              className="overflow-hidden rounded-xl border border-line bg-white p-3 hover:shadow-md"
            >
              <div className="relative aspect-square bg-soft">
                <Image src={img} alt={title} fill unoptimized className="object-contain p-3" />
              </div>
              <h2 className="mt-2 line-clamp-2 text-[13px] font-bold text-[#1a1a1a]">
                {title}
              </h2>
              <p className="mt-1 text-[15px] font-extrabold">
                ₺{formatPriceTry(product.price)}
              </p>
            </Link>
          );
        })}
      </div>
      {products.length === 0 ? (
        <p className="mt-8 text-muted">Bu kategoride henüz ürün yok.</p>
      ) : null}
    </ShopChrome>
  );
}
