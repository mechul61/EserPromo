import Image from "next/image";
import Link from "next/link";
import { QUICK_CATEGORIES } from "@/data/home";

export function CategoryShowcase() {
  return (
    <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {QUICK_CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/product-category/${cat.slug}`}
          className="group overflow-hidden rounded-xl border border-[#e8eaee] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="relative aspect-[4/3] bg-[#f5f6f8]">
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              unoptimized
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
              sizes="160px"
            />
          </div>
          <div className="px-2 pt-2.5 pb-3 text-center">
            <p className="line-clamp-2 min-h-[2.4rem] text-[13px] font-bold text-[#1a1a1a]">
              {cat.name}
            </p>
            <span className="mt-1.5 inline-flex rounded-md bg-[#f1f3f6] px-2.5 py-1 text-[11px] font-medium text-[#666] group-hover:bg-[#e8ebf0]">
              Keşfet &gt;
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
