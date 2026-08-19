"use client";

import Image from "next/image";
import Link from "next/link";
import type { ListingProduct } from "@/data/catalog-page";
import { quoteHref } from "@/data/catalog-page";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { PriceVatNote } from "@/components/pricing/PriceVatNote";
import { formatPriceTry, formatStock } from "@/lib/media";

export function CatalogProductCard({ product }: { product: ListingProduct }) {
  const productId = Number(product.id);

  return (
    <article className="flex h-full flex-col border border-[#e6e8ec] bg-white shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
      <div className="relative aspect-square bg-white">
        {product.isNew ? (
          <span
            className="absolute top-2.5 left-2.5 z-10 bg-[#22a45a] px-2 py-[3px] text-[10px] font-extrabold tracking-wide text-white"
            style={{ color: "#ffffff" }}
          >
            YENİ
          </span>
        ) : null}
        <FavoriteButton productId={productId} />
        <Link href={product.href} className="absolute inset-0">
          <Image
            src={product.image}
            alt={product.name}
            fill
            unoptimized
            className="object-contain p-4"
            sizes="(min-width: 1280px) 240px, (min-width: 768px) 33vw, 50vw"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-3.5 pt-1 pb-3.5">
        <p className="text-[11px] text-[#8b919a]">Kod: {product.code}</p>
        <h2 className="mt-1 line-clamp-2 min-h-[40px] text-[14px] leading-snug font-extrabold text-[#111]">
          <Link href={product.href}>{product.name}</Link>
        </h2>
        <p className="mt-2 text-[12px] leading-relaxed text-[#6b7280]">
          {product.size ? (
            <>
              Ebat: {product.size}
              <br />
            </>
          ) : null}
          {product.color ? (
            <>
              Renk: {product.color}
              <br />
            </>
          ) : null}
          Stok: {formatStock(product.stock)}
        </p>
        <p className="mt-3 text-[20px] leading-none font-extrabold text-[#111]">
          ₺{formatPriceTry(product.price)}
        </p>
        <PriceVatNote className="mt-1 text-[11px] text-[#8b919a]" />

        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          <Link
            href={product.href}
            className="flex h-9 items-center justify-center border border-[#cfd3d8] bg-white text-[11px] font-extrabold tracking-wide text-[#111] hover:border-navy"
          >
            DETAY
          </Link>
          <a
            href={quoteHref(product.code, product.name)}
            className="flex h-9 items-center justify-center bg-brand-red text-[11px] font-extrabold tracking-wide text-white hover:bg-[#c41820]"
            style={{ color: "#ffffff" }}
          >
            TEKLİF AL
          </a>
        </div>
      </div>
    </article>
  );
}
