"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ListingProduct } from "@/data/catalog-page";
import { CatalogProductCard } from "@/components/catalog/CatalogProductCard";
import type { CatalogListingScope } from "@/lib/catalog-listing-query";

type Props = {
  initialItems: ListingProduct[];
  initialPage: number;
  pageCount: number;
  total: number;
  scope: CatalogListingScope;
  emptyMessage?: string;
};

function scopeParam(scope: CatalogListingScope) {
  return scope.kind === "all" ? "all" : scope.slug;
}

export function CatalogInfiniteGrid({
  initialItems,
  initialPage,
  pageCount,
  total,
  scope,
  emptyMessage = "Henüz listelenecek ürün yok.",
}: Props) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialPage >= pageCount);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filterKey = searchParams.toString();

  useEffect(() => {
    setItems(initialItems);
    setPage(initialPage);
    setDone(initialPage >= pageCount);
    loadingRef.current = false;
  }, [filterKey, initialItems, initialPage, pageCount]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || done) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("scope", scopeParam(scope));
      params.set("page", String(page + 1));
      const res = await fetch(`/api/catalog/listing/?${params.toString()}`, {
        credentials: "same-origin",
      });
      const data = (await res.json()) as {
        items?: ListingProduct[];
        page?: number;
        pageCount?: number;
      };
      if (!res.ok || !data.items?.length) {
        setDone(true);
        return;
      }
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const next = data.items!.filter((p) => !seen.has(p.id));
        return next.length ? [...prev, ...next] : prev;
      });
      const nextPage = data.page ?? page + 1;
      const maxPage = data.pageCount ?? pageCount;
      setPage(nextPage);
      setDone(nextPage >= maxPage);
    } catch {
      setDone(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [done, page, pageCount, scope, searchParams]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || done) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, done]);

  if (items.length === 0) {
    return (
      <div className="border border-[#e6e8ec] bg-white px-6 py-16 text-center text-[14px] text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((product) => (
          <CatalogProductCard key={product.id} product={product} />
        ))}
      </div>

      {!done ? (
        <div
          ref={sentinelRef}
          className="mt-8 flex min-h-[48px] items-center justify-center py-4 text-[13px] text-[#8b919a]"
          aria-live="polite"
        >
          {loading ? "Daha fazla ürün yükleniyor…" : null}
        </div>
      ) : total > 0 ? (
        <p className="mt-6 text-center text-[13px] text-[#8b919a]">
          {items.length} / {total} ürün gösteriliyor
        </p>
      ) : null}
    </>
  );
}
