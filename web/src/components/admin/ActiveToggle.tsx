"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ActiveToggle({
  href,
  active,
  field = "isActive",
  activeLabel = "Aktif",
  inactiveLabel = "Pasif",
  onToggled,
}: {
  href: string;
  active: boolean;
  field?: "isActive" | "showOnHomepage";
  activeLabel?: string;
  inactiveLabel?: string;
  onToggled?: (next: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [value, setValue] = useState(active);

  useEffect(() => {
    setValue(active);
  }, [active]);

  async function toggle() {
    setPending(true);
    try {
      const url = href.endsWith("/") ? href : `${href}/`;
      const next = !value;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) return;
      setValue(next);
      onToggled?.(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={pending}
      className={`rounded px-2 py-1 text-[11px] font-extrabold tracking-wide ${
        value ? "bg-[#e8f7ee] text-[#1f9d55]" : "bg-[#fdecec] text-brand-red"
      } disabled:opacity-50`}
    >
      {value ? activeLabel : inactiveLabel}
    </button>
  );
}
