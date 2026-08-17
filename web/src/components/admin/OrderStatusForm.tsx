"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PAYMENT_STATUS_LABEL } from "@/lib/commerce/orders";

const OPTIONS = ["success", "pending", "failure", "refunded"] as const;

const FULFILLMENT = ["paid", "preparing", "shipped", "completed"];

function boxValue(orderStatus: string, paymentStatus?: string) {
  if (paymentStatus === "refunded") return "refunded";
  if (paymentStatus === "failure" || orderStatus === "failed") return "failure";
  if (paymentStatus === "success" || FULFILLMENT.includes(orderStatus)) return "success";
  return "pending";
}

function payloadFor(value: (typeof OPTIONS)[number], currentOrderStatus: string) {
  if (value === "pending") {
    return { status: "pending_payment" as const, paymentStatus: "pending" as const };
  }
  if (value === "failure") {
    return { status: "failed" as const, paymentStatus: "failure" as const };
  }
  if (value === "refunded") {
    return { status: "cancelled" as const, paymentStatus: "refunded" as const };
  }
  return {
    status: (FULFILLMENT.includes(currentOrderStatus) ? currentOrderStatus : "paid") as
      | "paid"
      | "preparing"
      | "shipped"
      | "completed",
    paymentStatus: "success" as const,
  };
}

export function OrderStatusForm({
  orderId,
  status,
  paymentStatus,
  compact = false,
}: {
  orderId: string;
  status: string;
  paymentStatus?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const current = boxValue(status, paymentStatus);
  const [value, setValue] = useState(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(boxValue(status, paymentStatus));
  }, [status, paymentStatus]);

  async function save() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFor(value, status)),
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
    <div className={`flex flex-wrap items-end gap-2 ${compact ? "" : "gap-3"}`}>
      <label className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">
        {compact ? <span className="sr-only">Ödeme durumu</span> : "Ödeme durumu"}
        <select
          value={value}
          onChange={(e) => setValue(e.target.value as (typeof OPTIONS)[number])}
          className={`block rounded-md border border-line bg-white px-2 text-[13px] font-semibold text-[#111] ${
            compact ? "h-9 min-w-[180px]" : "mt-1 h-10 min-w-[220px]"
          }`}
        >
          {OPTIONS.map((item) => (
            <option key={item} value={item}>
              {PAYMENT_STATUS_LABEL[item]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => void save()}
        disabled={pending || value === current}
        className={`rounded-md bg-navy px-4 text-[12px] font-extrabold tracking-wide text-white hover:bg-navy-deep disabled:opacity-50 ${
          compact ? "h-9" : "h-10"
        }`}
      >
        {pending ? "Kaydediliyor…" : "Güncelle"}
      </button>
      {error ? <p className="w-full text-[13px] text-brand-red">{error}</p> : null}
    </div>
  );
}
