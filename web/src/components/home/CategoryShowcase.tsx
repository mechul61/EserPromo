import Image from "next/image";
import Link from "next/link";
import { resolveCategoryImageSrc } from "@/lib/category-image";
import { getHomepageCategories } from "@/lib/catalog";
import { categoryPath } from "@/lib/seo/urls";

export async function CategoryShowcase() {
  const cats = await getHomepageCategories();
  if (cats.length === 0) return null;

  const items = await Promise.all(
    cats.map(async (cat) => ({
      ...cat,
      imageSrc: await resolveCategoryImageSrc(cat.id, cat.imageLocalPath),
    })),
  );

  return (
    <section className="mt-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {items.map((cat) => (
          <Link
            key={cat.slug}
            href={categoryPath(cat.slug)}
            className="group overflow-hidden rounded-xl border border-[#eceff3] bg-white transition hover:border-[#dbeafe] hover:shadow-sm"
          >
            <div className="relative aspect-square bg-white p-3 sm:p-4">
              <Image
                src={cat.imageSrc}
                alt={cat.name}
                fill
                unoptimized
                className="object-contain transition duration-300 group-hover:scale-[1.03]"
                sizes="160px"
              />
            </div>
            <div className="px-2 pb-3 pt-2 text-center">
              <p className="line-clamp-2 min-h-[2.4rem] text-[13px] font-bold text-navy">
                {cat.name}
              </p>
              <span className="mt-1.5 inline-block text-[12px] font-medium text-[#64748b] transition group-hover:text-navy">
                Keşfet &gt;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
