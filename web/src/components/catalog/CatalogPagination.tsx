import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  basePath: string;
  query: Record<string, string | string[] | undefined>;
  page: number;
  pageCount: number;
};

function pageHref(
  basePath: string,
  query: Props["query"],
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(query)) {
    if (key === "page" || raw == null) continue;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      if (value) params.append(key, value);
    }
  }
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function pagesToShow(page: number, pageCount: number) {
  if (pageCount <= 6) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const set = new Set([1, 2, 3, 4, pageCount, page, page - 1, page + 1]);
  return [...set]
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);
}

export function CatalogPagination({ basePath, query, page, pageCount }: Props) {
  if (pageCount <= 1) return null;
  const items = pagesToShow(page, pageCount);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Sayfalar">
      <PageLink
        href={pageHref(basePath, query, Math.max(1, page - 1))}
        disabled={page === 1}
        label="Önceki"
      >
        <ChevronLeft className="size-4" />
      </PageLink>
      {items.map((num, index) => {
        const prev = items[index - 1];
        return (
          <span key={num} className="contents">
            {prev && num - prev > 1 ? (
              <span className="px-1 text-[#888]">…</span>
            ) : null}
            <Link
              href={pageHref(basePath, query, num)}
              className={`flex size-9 items-center justify-center border text-[13px] font-bold ${
                num === page
                  ? "border-navy bg-navy text-white"
                  : "border-[#d5d8de] bg-white text-[#111] hover:border-navy"
              }`}
              style={num === page ? { color: "#ffffff" } : undefined}
            >
              {num}
            </Link>
          </span>
        );
      })}
      <PageLink
        href={pageHref(basePath, query, Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        label="Sonraki"
      >
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="flex size-9 items-center justify-center border border-[#ececec] bg-white text-[#c5c5c5]">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-9 items-center justify-center border border-[#d5d8de] bg-white text-[#111] hover:border-navy"
    >
      {children}
    </Link>
  );
}
