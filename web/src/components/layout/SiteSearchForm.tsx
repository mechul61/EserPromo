"use client";

import { Search } from "lucide-react";

export function SiteSearchForm({ defaultQuery = "" }: { defaultQuery?: string }) {
  return (
    <form className="relative w-full" action="/arama/" method="get" role="search">
      <input
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder="Ürün adı, kodu veya kategori ile arayın..."
        className="h-12 w-full rounded-md border border-[#cfd6e0] bg-white pr-14 pl-4 text-sm outline-none transition focus:border-navy"
      />
      <button
        type="submit"
        className="absolute top-1 right-1 flex h-10 w-11 items-center justify-center rounded bg-navy text-white hover:bg-navy-deep"
        aria-label="Ara"
      >
        <Search className="size-4" />
      </button>
    </form>
  );
}
