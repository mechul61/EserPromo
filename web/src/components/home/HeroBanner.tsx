import { getHeroSlides } from "@/lib/commerce/banners";
import { HomeHeroSlider } from "@/components/home/HomeHeroSlider";
import Image from "next/image";
import Link from "next/link";

export async function HeroBanner() {
  const slides = await getHeroSlides();
  if (slides.length === 1) {
    const slide = slides[0];
    return (
      <section className="relative overflow-hidden rounded-md border border-[#e5e7eb] shadow-sm">
        <div className="relative aspect-[1024/313] w-full">
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority
            unoptimized
            className="object-contain object-center"
            sizes="(max-width: 1400px) 100vw, 1400px"
          />
          <Link
            href={slide.href}
            className="absolute bottom-[18%] left-[4%] z-10 h-[12%] w-[22%] min-h-[44px] min-w-[140px] rounded-md"
            aria-label={slide.alt || "Ürünleri Keşfet"}
          />
        </div>
      </section>
    );
  }
  return <HomeHeroSlider slides={slides} />;
}
