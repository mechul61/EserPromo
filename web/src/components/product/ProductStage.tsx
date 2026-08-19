"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { PriceVatNote } from "@/components/pricing/PriceVatNote";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductGallery } from "@/components/product/ProductGallery";
import { formatPriceTry, formatStock } from "@/lib/media";
import { useState } from "react";

export type ProductColorOption = {
  name: string;
  hex: string;
  href: string;
  active: boolean;
};

export function ProductStage({
  productId,
  heading,
  sku,
  images,
  isNew,
  inStock,
  stock,
  unitPrice,
  specs,
  colors,
  sellable,
  maxQty,
}: {
  productId: number;
  heading: string;
  sku: string;
  images: string[];
  isNew?: boolean;
  inStock: boolean;
  stock: number;
  unitPrice: number;
  specs: Array<{ label: string; value: string }>;
  colors: ProductColorOption[];
  sellable?: boolean;
  maxQty?: number;
}) {
  const [qty, setQty] = useState(1);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,45%)_minmax(0,55%)] lg:items-stretch lg:gap-8">
      <div className="h-full min-h-0">
        <ProductGallery images={images} alt={heading} isNew={isNew} />
      </div>

      <div>
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h1 className="text-[22px] leading-tight font-extrabold tracking-wide text-navy uppercase sm:text-[24px]">
            {heading}
          </h1>
          <FavoriteButton productId={productId} variant="plain" iconClassName="size-5" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          <span className={`inline-flex items-center gap-1.5 font-bold ${inStock ? "text-brand-green" : "text-brand-red"}`}>
            <Check className="size-4" strokeWidth={3} />
            {inStock ? `Stokta · ${formatStock(stock)}` : "Stok yok"}
          </span>
          <span className="min-w-0 break-all text-[#6b7280]">
            Stok Kodu: <span className="font-semibold text-[#111]">{sku}</span>
          </span>
        </div>

        <p className="mt-3 text-[30px] leading-none font-extrabold text-brand-red">
          ₺{formatPriceTry(unitPrice)}
        </p>
        <PriceVatNote />

        <dl className="mt-4">
          {specs.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[118px_minmax(0,1fr)] border-b border-[#ececec] py-[7px] text-[13px]"
            >
              <dt className="text-[#8b919a]">{row.label}</dt>
              <dd className="font-medium text-[#111]">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,248px)]">
          <div>
            {colors.length > 0 ? (
              <div>
                <p className="text-[12px] font-extrabold tracking-wide text-[#111]">RENK SEÇENEKLERİ</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <Link
                      key={color.href + color.name}
                      href={color.href}
                      title={color.name}
                      className={`size-7 rounded-[3px] ${
                        color.active ? "border-2 border-orange" : "border border-[#cfd3d8]"
                      }`}
                      style={{ background: color.hex }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <ProductBuyBox
              productId={productId}
              name={heading}
              sku={sku}
              unit={unitPrice}
              stock={stock}
              qty={qty}
              onQty={setQty}
              sellable={sellable}
              maxQty={maxQty}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
