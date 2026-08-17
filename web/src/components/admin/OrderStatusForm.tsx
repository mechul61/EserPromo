"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABEL } from "@/lib/commerce/orders";

const STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "shipped",
  "completed",
  "cancelled",
  "failed",
] as const;

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: value }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Güncellenemedi");
        return;
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">
        Durum
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 block h-10 min-w-[200px] rounded-md border border-line bg-white px-2 text-[13px] font-semibold text-[#111]"
        >
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {ORDER_STATUS_LABEL[item]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => void save()}
        disabled={pending || value === status}
        className="h-10 rounded-md bg-navy px-4 text-[12px] font-extrabold tracking-wide text-white hover:bg-navy-deep disabled:opacity-50"
      >
        {pending ? "Kaydediliyor…" : "Güncelle"}
      </button>
      {error ? <p className="w-full text-[13px] text-brand-red">{error}</p> : null}
    </div>
  );
}
