import { Search } from "lucide-react";

export function SearchPageHero({ query }: { query: string }) {
  return (
    <section className="mb-5 overflow-hidden rounded-md border border-[#e6e8ec] bg-white shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
      <div className="border-b border-[#eceef1] bg-soft px-4 py-3 sm:px-5">
        <h1 className="text-[22px] font-extrabold tracking-wide text-[#111] uppercase sm:text-[26px]">
          Gelişmiş Arama
        </h1>
        <p className="mt-1 text-[13px] text-[#8b919a]">
          Ürün adı, stok kodu, kategori veya renk ile arayın; sonuçları filtreleyip sıralayın.
        </p>
      </div>

      <form action="/arama/" method="get" role="search" className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8b919a]" />
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Örn. bursa, kalem seti, 12345, ajanda..."
            className="h-12 w-full rounded-md border border-[#cfd6e0] bg-white pr-4 pl-11 text-[14px] outline-none transition focus:border-navy"
            autoFocus={!query}
          />
        </div>
        <button
          type="submit"
          className="flex h-12 shrink-0 items-center justify-center rounded-md bg-navy px-8 text-[13px] font-extrabold tracking-wide text-white hover:bg-navy-deep"
        >
          ARA
        </button>
      </form>
    </section>
  );
}
