"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function AdminSearch({
  action,
  placeholder,
  q = "",
}: {
  action: string;
  placeholder: string;
  q?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(q);
  }, [q]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function go(next: string) {
    const trimmed = next.trim();
    const href = trimmed ? `${action}?q=${encodeURIComponent(trimmed)}` : action;
    router.replace(href);
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(next), 180);
  }

  return (
    <input
      name="q"
      value={value}
      autoComplete="off"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (timer.current) clearTimeout(timer.current);
          go(value);
        }
      }}
      className="h-10 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-navy"
    />
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
