"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

const tabs = [
  "Çok Satanlar",
  "Yeni Ürünler",
  "Kampanyalı Ürünler",
  "Öne Çıkanlar",
] as const;

const badgeClass = {
  "Çok Satan": "bg-[#1f9d55]",
  Yeni: "bg-[#f5a623]",
  Kampanyalı: "bg-[#e31b23]",
} as const;

export type HomeProduct = {
  id: number;
  href: string;
  code: string;
  name: string;
  image: string;
  price: string;
  inStock: boolean;
  stock: number;
  badge: keyof typeof badgeClass;
};

export function ProductSection({ products }: { products: HomeProduct[] }) {
  const [active, setActive] = useState<(typeof tabs)[number]>("Çok Satanlar");

  const visible = useMemo(() => {
    if (active === "Yeni Ürünler") {
      return products.filter((p) => p.badge === "Yeni").slice(0, 6);
    }
    if (active === "Kampanyalı Ürünler") {
      return products.filter((p) => p.badge === "Kampanyalı").slice(0, 6);
    }
    if (active === "Çok Satanlar") {
      return products.filter((p) => p.badge === "Çok Satan").slice(0, 6);
    }
    return products.slice(0, 6);
  }, [active, products]);

  if (products.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#e8eaee]">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={`px-3 py-3 text-[14px] font-bold transition ${
                active === tab
                  ? "border-b-[3px] border-brand-red text-[#1a1a1a]"
                  : "border-b-[3px] border-transparent text-[#6b7280] hover:text-navy"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <Link
          href="/product-category/yeni-urunler/"
          className="pb-3 text-[13px] font-medium text-[#6b7280] hover:text-navy"
        >
          Tüm Ürünleri Gör →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {visible.map((product, i) => (
          <article
            key={`${active}-${product.id}`}
            className="animate-fade-up group overflow-hidden rounded-xl border border-[#e8eaee] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="relative bg-[#fafbfc]">
              <span
                className={`absolute top-2.5 left-2.5 z-10 rounded px-2 py-0.5 text-[10px] font-bold text-white ${badgeClass[product.badge]}`}
              >
                {product.badge}
              </span>
              <FavoriteButton
                productId={product.id}
                variant="home"
                iconClassName="size-4"
              />
              <div className="relative mx-auto aspect-square w-full max-w-[180px]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  unoptimized
                  className="object-contain p-4 transition duration-300 group-hover:scale-[1.03]"
                  sizes="180px"
                />
              </div>
            </div>

            <div className="space-y-2 p-3 pt-1">
              <p className="text-[11px] text-[#9ca3af]">Kod: {product.code}</p>
              <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-snug font-bold text-[#1a1a1a]">
                {product.name}
              </h3>
              <div className="flex items-end justify-between gap-2">
                <p className="text-[16px] font-extrabold text-[#1a1a1a]">
                  ₺{product.price}
                </p>
                {product.inStock ? (
                  <p className="flex flex-col items-end text-[11px] font-semibold leading-tight text-[#1f9d55]">
                    <span className="inline-flex items-center gap-1">
                      <Check className="size-3.5" strokeWidth={3} />
                      Stokta
                    </span>
                    <span>{product.stock.toLocaleString("tr-TR")} Adet</span>
                  </p>
                ) : (
                  <p className="text-[11px] font-semibold text-brand-red">Stok yok</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href={product.href}
                  className="rounded-md bg-[#eef0f3] px-2 py-2 text-center text-[12px] font-semibold text-[#333] hover:bg-[#e4e7eb]"
                >
                  Detay
                </Link>
                <Link
                  href={product.href}
                  className="rounded-md bg-[#f5a623] px-2 py-2 text-center text-[12px] font-bold text-[#111] hover:bg-orange-hover"
                >
                  Teklif Al
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
