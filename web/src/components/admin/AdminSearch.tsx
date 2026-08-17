import Link from "next/link";

export function AdminSearch({
  action,
  placeholder,
  q,
}: {
  action: string;
  placeholder: string;
  q?: string;
}) {
  return (
    <form action={action} method="get" className="flex gap-2">
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="h-10 min-w-0 flex-1 rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-navy"
      />
      <button
        type="submit"
        className="h-10 rounded-md bg-navy px-4 text-[12px] font-extrabold tracking-wide text-white hover:bg-navy-deep"
      >
        Ara
      </button>
    </form>
  );
}

export function AdminPager({
  href,
  page,
  pageCount,
  q,
}: {
  href: string;
  page: number;
  pageCount: number;
  q?: string;
}) {
  if (pageCount <= 1) return null;
  const query = q ? `&q=${encodeURIComponent(q)}` : "";
  return (
    <div className="mt-4 flex items-center justify-between text-[13px]">
      <p className="text-[#6b7280]">
        Sayfa {page} / {pageCount}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={`${href}?page=${page - 1}${query}`}
            className="rounded-md border border-line bg-white px-3 py-1.5 font-semibold hover:border-navy"
          >
            Önceki
          </Link>
        ) : null}
        {page < pageCount ? (
          <Link
            href={`${href}?page=${page + 1}${query}`}
            className="rounded-md border border-line bg-white px-3 py-1.5 font-semibold hover:border-navy"
          >
            Sonraki
          </Link>
        ) : null}
      </div>
    </div>
  );
}
