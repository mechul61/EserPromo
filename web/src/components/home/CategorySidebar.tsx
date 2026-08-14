import Link from "next/link";
import { Check, ChevronRight, Menu } from "lucide-react";
import { CATEGORIES, TEXTILE_PERKS } from "@/data/home";

/** Sol kategori paneli — KATEGORİLER + liste tek parça (referans 1) */
export function CategorySidebar() {
  return (
    <aside id="kategoriler" className="w-full shrink-0 scroll-mt-24 lg:w-[270px]">
      <div className="overflow-hidden rounded-md border border-line bg-white shadow-md">
        <div
          className="flex h-12 items-center gap-2.5 bg-navy px-4 text-[13px] font-bold tracking-wide text-white"
          style={{ color: "#ffffff" }}
        >
          <Menu className="size-5 shrink-0" strokeWidth={2.5} color="#ffffff" />
          KATEGORİLER
        </div>

        <ul>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <li key={cat.slug} className="border-b border-[#ececec] last:border-b-0">
                <Link
                  href={`/product-category/${cat.slug}`}
                  className={`group flex items-center gap-3 px-3.5 py-[11px] text-[13px] transition hover:bg-[#fafafa] ${
                    cat.highlight
                      ? "font-extrabold tracking-wide text-brand-red"
                      : "font-medium text-[#222]"
                  }`}
                >
                  <Icon
                    className={`size-[18px] shrink-0 ${cat.iconClassName ?? "text-[#222]"}`}
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1 leading-snug">{cat.name}</span>
                  <ChevronRight className="size-4 shrink-0 text-[#cfcfcf] group-hover:text-[#999]" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-md bg-[#0a5aa8] p-4 text-white shadow-sm">
        <div className="relative z-10 max-w-[58%]">
          <p className="text-[13px] leading-tight font-medium text-white/95">
            Tekstil Ürünlerinde
          </p>
          <p className="mt-0.5 text-[22px] leading-none font-extrabold text-[#ffc107]">
            Logo Baskı
          </p>
          <p className="text-[22px] leading-tight font-extrabold text-white">
            Avantajları
          </p>
          <ul className="mt-3 space-y-1">
            {TEXTILE_PERKS.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-[12px] font-medium">
                <Check className="size-3.5 shrink-0 text-[#7CFC00]" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/product-category/tekstil"
            className="mt-4 inline-flex rounded bg-[#f5a623] px-3 py-2 text-[12px] font-bold text-[#111] hover:bg-orange-hover"
          >
            Ürünleri İncele
          </Link>
        </div>
        <div className="pointer-events-none absolute top-3 right-2 bottom-3 flex w-[42%] flex-col items-center justify-end gap-2">
          <div className="flex h-[72px] w-[78px] items-center justify-center rounded bg-white/95 shadow-md">
            <div className="h-14 w-12 rounded-t-full bg-[#eef2f7] ring-1 ring-[#dbe3ee]" />
          </div>
          <div className="flex h-[52px] w-[64px] items-center justify-center rounded-full bg-white/95 shadow-md">
            <div className="h-8 w-10 rounded-t-full bg-[#eef2f7] ring-1 ring-[#dbe3ee]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
