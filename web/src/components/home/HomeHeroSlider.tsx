"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { heroSlideAspectStyle, type HeroSlide } from "@/lib/commerce/hero-slide";

export type { HeroSlide };

export function HomeHeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

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
          href={slide.href || "/urunler"}
          className="absolute inset-0 z-10"
          aria-label={slide.alt || "Kampanya"}
        />
      </div>
      {slides.length > 1 ? (
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
          {slides.map((item, i) => (
            <button
              key={`${item.src}-${i}`}
              type="button"
              aria-label={`Slayt ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full ${i === index ? "w-5 bg-navy" : "w-2 bg-white/80"}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
