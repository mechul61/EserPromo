"use client";

import { useEffect, useState } from "react";
import { CatalogProductCard } from "@/components/catalog/CatalogProductCard";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import type { ListingProduct } from "@/data/catalog-page";

export function FavoritesView({ initial }: { initial: ListingProduct[] }) {
  const { ids, ready, authenticated } = useFavorites();
  const [items, setItems] = useState(initial);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const visible =
    ready && authenticated
      ? items.filter((product) => ids.has(Number(product.id)))
      : items;

  if (visible.length === 0) {
    return (
      <div className="rounded-md border border-line bg-white p-6 text-[14px] text-[#555]">
        Favori listeniz henüz boş. Ürün sayfalarından favorilere ekleyebilirsiniz.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {visible.map((product) => (
        <CatalogProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
