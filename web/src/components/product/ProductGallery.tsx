"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductGallery({
  images,
  alt,
  isNew,
}: {
  images: string[];
  alt: string;
  isNew?: boolean;
}) {
  const source = images.length > 0 ? images : ["/brand/logo.png"];
  const thumbs =
    source.length >= 4
      ? source.slice(0, 4)
      : Array.from({ length: 4 }, (_, i) => source[i % source.length]);
  const [index, setIndex] = useState(0);
  const current = thumbs[index] ?? thumbs[0];

  return (
    <div className="flex h-auto min-h-[250px] flex-col lg:h-[70%]">
      <div className="relative min-h-[250px] flex-1 border border-[#e6e8ec] bg-white lg:min-h-0">
        {isNew ? (
          <span
            className="absolute top-3 left-3 z-10 rounded-sm bg-brand-red px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white"
            style={{ color: "#ffffff" }}
          >
            Yeni Ürün
          </span>
        ) : null}
        <button
          type="button"
          aria-label="Önceki görsel"
          onClick={() => setIndex((i) => (i - 1 + thumbs.length) % thumbs.length)}
          className="absolute top-1/2 left-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#eceff3] text-[#5b616a]"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Sonraki görsel"
          onClick={() => setIndex((i) => (i + 1) % thumbs.length)}
          className="absolute top-1/2 right-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#eceff3] text-[#5b616a]"
        >
          <ChevronRight className="size-4" />
        </button>
        <Image src={current} alt={alt} fill unoptimized className="object-contain p-8" priority />
      </div>
      <div className="mt-2 grid shrink-0 grid-cols-4 gap-2">
        {thumbs.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            className={`relative aspect-square bg-white ${
              i === index ? "border-2 border-orange" : "border border-[#e6e8ec]"
            }`}
          >
            <Image src={src} alt="" fill unoptimized className="object-contain p-1.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
