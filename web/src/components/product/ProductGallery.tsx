"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Search, X, ZoomIn, ZoomOut } from "lucide-react";

const THUMB_VISIBLE = 4;

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
  const thumbs = [...new Set(source)];
  const [index, setIndex] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const [hoverZoom, setHoverZoom] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const [lbZoom, setLbZoom] = useState(1);
  const current = thumbs[index] ?? thumbs[0];
  const hasMany = thumbs.length > 1;
  const thumbOverflow = thumbs.length > THUMB_VISIBLE;
  const maxThumbStart = Math.max(0, thumbs.length - THUMB_VISIBLE);

  function selectIndex(next: number) {
    setIndex(next);
    setLbZoom(1);
    if (thumbOverflow) {
      if (next < thumbStart) setThumbStart(next);
      else if (next >= thumbStart + THUMB_VISIBLE) setThumbStart(next - THUMB_VISIBLE + 1);
    }
  }

  const goPrev = useCallback(() => {
    setIndex((i) => {
      const next = (i - 1 + thumbs.length) % thumbs.length;
      setThumbStart((start) => {
        if (thumbs.length <= THUMB_VISIBLE) return 0;
        if (next < start) return next;
        if (next >= start + THUMB_VISIBLE) return Math.min(maxThumbStart, next);
        return start;
      });
      return next;
    });
    setLbZoom(1);
  }, [maxThumbStart, thumbs.length]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      const next = (i + 1) % thumbs.length;
      setThumbStart((start) => {
        if (thumbs.length <= THUMB_VISIBLE) return 0;
        if (next < start) return 0;
        if (next >= start + THUMB_VISIBLE) return Math.min(maxThumbStart, next - THUMB_VISIBLE + 1);
        return start;
      });
      return next;
    });
    setLbZoom(1);
  }, [maxThumbStart, thumbs.length]);

  function openLightbox() {
    setLbZoom(1);
    setLightbox(true);
  }

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft" && thumbs.length > 1) {
        goPrev();
      }
      if (e.key === "ArrowRight" && thumbs.length > 1) {
        goNext();
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [goNext, goPrev, lightbox, thumbs.length]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  return (
    <div className="flex h-auto min-h-[250px] flex-col lg:h-[82%]">
      <div
        className="group/stage relative min-h-[250px] flex-1 cursor-zoom-in overflow-hidden border border-[#e6e8ec] bg-white lg:min-h-0"
        onMouseEnter={() => {
          if (window.matchMedia("(hover: hover)").matches) setHoverZoom(true);
        }}
        onMouseLeave={() => setHoverZoom(false)}
        onMouseMove={onMove}
        onClick={openLightbox}
      >
        {isNew ? (
          <span
            className="absolute top-3 left-3 z-10 rounded-sm bg-brand-red px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white"
            style={{ color: "#ffffff" }}
          >
            Yeni Ürün
          </span>
        ) : null}
        <span className="pointer-events-none absolute right-3 bottom-3 z-10 hidden size-8 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm lg:flex">
          <Search className="size-4" />
        </span>
        {hasMany ? (
          <>
            <button
              type="button"
              aria-label="Önceki görsel"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute top-1/2 left-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#eceff3] text-[#5b616a]"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Sonraki görsel"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute top-1/2 right-2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#eceff3] text-[#5b616a]"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        ) : null}
        <Image
          src={current}
          alt={alt}
          fill
          unoptimized
          priority
          className={`object-contain p-8 transition duration-150 ease-out ${
            hoverZoom ? "p-0" : ""
          }`}
          style={
            hoverZoom
              ? {
                  transform: "scale(2.15)",
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                }
              : undefined
          }
        />
      </div>
      <div className="relative mt-2 h-[72px] shrink-0 sm:h-[80px]">
        {thumbOverflow ? (
          <button
            type="button"
            aria-label="Önceki küçük görseller"
            disabled={thumbStart <= 0}
            onClick={() => setThumbStart((s) => Math.max(0, s - 1))}
            className="absolute top-1/2 left-0 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#eceff3] text-[#5b616a] disabled:opacity-35"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        ) : null}
        <div
          className={`grid h-full grid-cols-4 gap-2 ${thumbOverflow ? "mx-8" : ""}`}
        >
          {thumbs.slice(thumbStart, thumbStart + THUMB_VISIBLE).map((src, offset) => {
            const i = thumbStart + offset;
            return (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => selectIndex(i)}
                className={`relative h-full min-h-0 bg-white ${
                  i === index ? "border-2 border-orange" : "border border-[#e6e8ec]"
                }`}
              >
                <Image src={src} alt="" fill unoptimized className="object-contain p-1.5" />
              </button>
            );
          })}
        </div>
        {thumbOverflow ? (
          <button
            type="button"
            aria-label="Sonraki küçük görseller"
            disabled={thumbStart >= maxThumbStart}
            onClick={() => setThumbStart((s) => Math.min(maxThumbStart, s + 1))}
            className="absolute top-1/2 right-0 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#eceff3] text-[#5b616a] disabled:opacity-35"
          >
            <ChevronRight className="size-3.5" />
          </button>
        ) : null}
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Ürün görseli"
        >
          <button
            type="button"
            aria-label="Kapat"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white text-navy"
          >
            <X className="size-5" />
          </button>
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              type="button"
              aria-label="Uzaklaştır"
              onClick={(e) => {
                e.stopPropagation();
                setLbZoom((z) => Math.max(1, Number((z - 0.4).toFixed(1))));
              }}
              className="flex size-10 items-center justify-center rounded-full bg-white text-navy"
            >
              <ZoomOut className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Yakınlaştır"
              onClick={(e) => {
                e.stopPropagation();
                setLbZoom((z) => Math.min(4, Number((z + 0.4).toFixed(1))));
              }}
              className="flex size-10 items-center justify-center rounded-full bg-white text-navy"
            >
              <ZoomIn className="size-5" />
            </button>
          </div>
          {hasMany ? (
            <>
              <button
                type="button"
                aria-label="Önceki görsel"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute top-1/2 left-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Sonraki görsel"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute top-1/2 right-4 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
          <div
            className="relative max-h-[88vh] max-w-[min(1100px,92vw)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              setLbZoom((z) =>
                Math.min(4, Math.max(1, Number((z + (e.deltaY < 0 ? 0.25 : -0.25)).toFixed(2)))),
              );
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current}
              alt={alt}
              className="max-h-[88vh] max-w-[min(1100px,92vw)] object-contain transition-transform duration-150"
              style={{ transform: `scale(${lbZoom})` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
