import { getHeroSlides } from "@/lib/commerce/banners";
import { heroSlideAspectStyle } from "@/lib/commerce/hero-slide";
import { HomeHeroSlider } from "@/components/home/HomeHeroSlider";
import Image from "next/image";
import Link from "next/link";

export async function HeroBanner() {
  const slides = await getHeroSlides();
  if (slides.length === 1) {
    const slide = slides[0];
    return (
      <section className="relative overflow-hidden rounded-md border border-[#e5e7eb] shadow-sm">
        <div className="relative w-full" style={heroSlideAspectStyle(slide.width, slide.height)}>
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority
            unoptimized
            className="object-cover object-center"
            sizes="(max-width: 1400px) 100vw, 1400px"
          />
          <Link
            href={slide.href}
            className="absolute inset-0 z-10"
            aria-label={slide.alt || "Ürünleri Keşfet"}
          />
        </div>
      </section>
    );
  }
  return <HomeHeroSlider slides={slides} />;
}
