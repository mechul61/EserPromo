"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActiveToggle({
  href,
  active,
  activeLabel = "Aktif",
  inactiveLabel = "Pasif",
}: {
  href: string;
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await fetch(href, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !active }),
      });
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
        active ? "bg-[#e8f7ee] text-[#1f9d55]" : "bg-[#fdecec] text-brand-red"
      } disabled:opacity-50`}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}
