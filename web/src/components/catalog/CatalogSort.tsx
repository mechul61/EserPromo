"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "populer", label: "Popüler" },
  { value: "yeni", label: "En Yeni" },
  { value: "fiyat-artan", label: "Fiyat: Artan" },
  { value: "fiyat-azalan", label: "Fiyat: Azalan" },
  { value: "ad", label: "İsim (A-Z)" },
] as const;

export function CatalogSort({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-[#333]">
      <span>Sıralama:</span>
      <select
        value={value || "populer"}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          const selected = event.target.value;
          if (!selected || selected === "populer") next.delete("sira");
          else next.set("sira", selected);
          next.delete("page");
          const qs = next.toString();
          router.push(qs ? `${pathname}?${qs}` : pathname);
        }}
        className="h-9 min-w-[148px] rounded-md border border-[#d5d8de] bg-white px-2.5 text-[13px] outline-none"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
