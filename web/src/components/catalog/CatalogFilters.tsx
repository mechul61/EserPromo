import Link from "next/link";
import {
  COVER_FILTERS,
  COLOR_FILTERS,
  PAGE_TYPE_FILTERS,
  PRINT_FILTERS,
  SIZE_FILTERS,
  asParamList,
} from "@/data/catalog-page";

type Props = {
  basePath: string;
  query: Record<string, string | string[] | undefined>;
};

function hrefWith(basePath: string, query: Props["query"], patch: Record<string, string | string[] | null>) {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries({ ...query, ...patch })) {
    if (raw == null) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      if (value) params.append(key, value);
    }
  }
  params.delete("page");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function toggleHref(
  basePath: string,
  query: Props["query"],
  key: string,
  value: string,
) {
  const current = asParamList(query[key]);
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return hrefWith(basePath, query, { [key]: next.length ? next : null });
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#eceef1] px-3.5 py-3.5 last:border-b-0">
      <h4 className="mb-2.5 text-[12px] font-extrabold tracking-wide text-[#111]">{title}</h4>
      {children}
    </div>
  );
}

export function CatalogFilters({ basePath, query }: Props) {
  const renk = asParamList(query.renk);
  const ebat = asParamList(query.ebat);
  const sayfa = asParamList(query.sayfa);
  const kapak = asParamList(query.kapak);
  const baski = asParamList(query.baski);

  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-sm border border-[#e6e8ec] bg-white lg:w-[230px]">
      <div className="border-b border-[#eceef1] px-3.5 py-3 text-[13px] font-extrabold tracking-wide text-[#111]">
        FİLTRELEME
      </div>

      <FilterGroup title="RENK">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {COLOR_FILTERS.map((color) => {
            const active = renk.includes(color.key);
            return (
              <Link
                key={`swatch-${color.key}`}
                href={toggleHref(basePath, query, "renk", color.key)}
                aria-label={color.label}
                className={`size-[22px] rounded-[4px] border ${
                  active ? "border-navy ring-1 ring-navy" : "border-black/15"
                }`}
                style={{ background: color.hex }}
              />
            );
          })}
        </div>
        <ul className="space-y-1.5">
          {COLOR_FILTERS.map((color) => {
            const active = renk.includes(color.key);
            return (
              <li key={color.key}>
                <Link
                  href={toggleHref(basePath, query, "renk", color.key)}
                  className={`flex items-center gap-2 text-[12px] ${active ? "font-bold text-navy" : "text-[#333]"}`}
                >
                  <span
                    className="size-3.5 shrink-0 rounded-[2px] border border-black/15"
                    style={{ background: color.hex }}
                  />
                  {color.label}
                  <span className="text-[#8b919a]">({color.count})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="EBAT">
        {SIZE_FILTERS.map((item) => (
          <CheckRow
            key={item.key}
            href={toggleHref(basePath, query, "ebat", item.key)}
            label={item.key}
            count={item.count}
            checked={ebat.includes(item.key)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="SAYFA TİPİ">
        {PAGE_TYPE_FILTERS.map((item) => (
          <CheckRow
            key={item.key}
            href={toggleHref(basePath, query, "sayfa", item.key)}
            label={item.key}
            count={item.count}
            checked={sayfa.includes(item.key)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="KAPAK TÜRÜ">
        {COVER_FILTERS.map((item) => (
          <CheckRow
            key={item.key}
            href={toggleHref(basePath, query, "kapak", item.key)}
            label={item.key}
            count={item.count}
            checked={kapak.includes(item.key)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="BASKI SEÇENEĞİ">
        {PRINT_FILTERS.map((item) => (
          <CheckRow
            key={item.key}
            href={toggleHref(basePath, query, "baski", item.key)}
            label={item.key}
            count={item.count}
            checked={baski.includes(item.key)}
          />
        ))}
      </FilterGroup>

      <div className="p-3.5">
        <Link
          href={basePath}
          className="flex h-9 items-center justify-center rounded-sm border border-[#d5d8de] bg-white text-[11px] font-extrabold tracking-wide text-[#6b7280] hover:border-navy hover:text-navy"
        >
          FİLTRELERİ TEMİZLE
        </Link>
      </div>
    </aside>
  );
}

function CheckRow({
  href,
  label,
  count,
  checked,
}: {
  href: string;
  label: string;
  count: number;
  checked: boolean;
}) {
  return (
    <Link href={href} className="mb-1.5 flex items-center gap-2 text-[12px] text-[#333] last:mb-0">
      <span
        className={`flex size-[14px] items-center justify-center rounded-[2px] border ${
          checked ? "border-navy bg-navy" : "border-[#c5cad1] bg-white"
        }`}
      >
        {checked ? <span className="block size-1.5 rounded-[1px] bg-white" /> : null}
      </span>
      {label}
      <span className="text-[#8b919a]">({count})</span>
    </Link>
  );
}
