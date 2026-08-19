"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductGallery } from "@/components/product/ProductGallery";
import { formatPriceTry, formatStock } from "@/lib/media";
import {
  bulkTiers,
  unitForQty,
  type PrintKind,
} from "@/lib/product-detail";
import { useMemo, useState } from "react";

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
  const [printType, setPrintType] = useState<PrintKind | null>(null);
  const [pickedPrintTier, setPickedPrintTier] = useState(false);
  const tiers = useMemo(() => bulkTiers(unitPrice, printType), [unitPrice, printType]);
  const unit = printType && pickedPrintTier ? unitForQty(tiers, qty) : unitPrice;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,45%)_minmax(0,55%)] lg:items-stretch lg:gap-8">
      <div className="h-full min-h-0">
        <ProductGallery images={images} alt={heading} isNew={isNew} />
      </div>

      <div>
        <div className="flex items-start justify-between gap-3">
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
          <span className="text-[#6b7280]">
            Stok Kodu: <span className="font-semibold text-[#111]">{sku}</span>
          </span>
        </div>

        <p className="mt-3 text-[30px] leading-none font-extrabold text-brand-red">
          ₺{formatPriceTry(unit)}
        </p>
        <p className="mt-1 text-[12px] text-[#8b919a]">KDV Dahil</p>

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

            <div className={colors.length > 0 ? "mt-4" : ""}>
              <p className="text-[12px] font-extrabold tracking-wide text-[#111]">BASKI TÜRÜ</p>
              <p className="mt-1 text-[12px] text-[#8b919a]">İsteğe bağlı — baskısız da sipariş verebilirsiniz.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["UV Baskı", "Tampon Baskı"] as const).map((item) => {
                  const selected = printType === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        if (selected) {
                          setPrintType(null);
                          setPickedPrintTier(false);
                        } else {
                          setPrintType(item);
                          setPickedPrintTier(false);
                        }
                      }}
                      className={`h-9 min-w-[108px] rounded-md bg-white px-3 text-[12px] font-bold ${
                        selected
                          ? "border-2 border-orange text-orange"
                          : "border border-[#d5d8de] text-[#111]"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {printType ? (
              <div className="mt-4">
                <p className="mb-2 text-[12px] font-extrabold tracking-wide text-[#111]">
                  ADET SEÇİNİZ - BİRİM FİYAT
                </p>
                <div className="border border-[#e6e8ec]">
                  {tiers.map((tier) => {
                    const selected = pickedPrintTier && qty >= tier.min && qty <= tier.max;
                    return (
                      <label
                        key={tier.min}
                        className={`flex cursor-pointer items-center justify-between gap-3 border-b border-[#ececec] px-3 py-2 text-[13px] last:border-b-0 ${
                          selected ? "bg-[#fff4e5]" : "bg-white"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`flex size-[15px] items-center justify-center rounded-full border-2 ${
                              selected ? "border-orange" : "border-[#c5c5c5]"
                            }`}
                          >
                            {selected ? <span className="size-2 rounded-full bg-orange" /> : null}
                          </span>
                          <input
                            type="radio"
                            name="adet-dilim"
                            className="sr-only"
                            checked={selected}
                            onChange={() => {
                              setPickedPrintTier(true);
                              setQty(tier.min);
                            }}
                          />
                          {tier.min.toLocaleString("tr-TR")} - {tier.max.toLocaleString("tr-TR")} Adet
                        </span>
                        <span className="font-bold text-[#111]">₺{formatPriceTry(tier.unit)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <ProductBuyBox
              productId={productId}
              name={heading}
              sku={sku}
              unit={unit}
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
