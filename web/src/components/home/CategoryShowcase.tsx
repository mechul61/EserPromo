import Image from "next/image";
import Link from "next/link";
import { getHomepageCategories } from "@/lib/catalog";
import { mediaUrl } from "@/lib/media";
import { categoryPath } from "@/lib/seo/urls";

export async function CategoryShowcase() {
  const cats = await getHomepageCategories();

  if (cats.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {cats.map((cat) => (
          <Link
            key={cat.slug}
            href={categoryPath(cat.slug)}
            className="group bg-white"
          >
            <div className="relative aspect-square overflow-hidden bg-white">
              <Image
                src={mediaUrl(cat.imageLocalPath) ?? "/brand/logo.png"}
                alt={cat.name}
                fill
                unoptimized
                className="object-cover scale-[1.08] transition duration-300 group-hover:scale-[1.12]"
                sizes="160px"
              />
            </div>
            <div className="px-2 pt-2.5 pb-3 text-center">
              <p className="line-clamp-2 min-h-[2.4rem] text-[13px] font-bold text-navy">
                {cat.name}
              </p>
              <span className="mt-1.5 inline-block text-[12px] font-medium text-navy">
                Keşfet &gt;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
