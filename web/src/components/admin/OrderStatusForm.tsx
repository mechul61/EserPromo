"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CARGO_STATUS_OPTIONS, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/commerce/orders-copy";

const PAYMENT_OPTIONS = ["success", "pending", "failure", "refunded"] as const;
const FULFILLMENT = ["paid", "preparing", "shipped", "completed"];

function boxValue(orderStatus: string, paymentStatus?: string): (typeof PAYMENT_OPTIONS)[number] {
  if (paymentStatus === "refunded") return "refunded";
  if (paymentStatus === "failure" || orderStatus === "failed") return "failure";
  if (paymentStatus === "success" || FULFILLMENT.includes(orderStatus)) return "success";
  return "pending";
}

function cargoValue(orderStatus: string): (typeof CARGO_STATUS_OPTIONS)[number] {
  if (CARGO_STATUS_OPTIONS.includes(orderStatus as (typeof CARGO_STATUS_OPTIONS)[number])) {
    return orderStatus as (typeof CARGO_STATUS_OPTIONS)[number];
  }
  return "paid";
}

function payloadFor(
  payment: (typeof PAYMENT_OPTIONS)[number],
  cargo: (typeof CARGO_STATUS_OPTIONS)[number],
) {
  if (payment === "pending") {
    return { status: "pending_payment" as const, paymentStatus: "pending" as const };
  }
  if (payment === "failure") {
    return { status: "failed" as const, paymentStatus: "failure" as const };
  }
  if (payment === "refunded") {
    return { status: "cancelled" as const, paymentStatus: "refunded" as const };
  }
  return { status: cargo, paymentStatus: "success" as const };
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
  const currentPay = boxValue(status, paymentStatus);
  const currentCargo = cargoValue(status);
  const [pay, setPay] = useState(currentPay);
  const [cargo, setCargo] = useState(currentCargo);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = pay !== currentPay || (pay === "success" && cargo !== currentCargo);

  async function save() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFor(pay, cargo)),
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

  const selectClass = `block rounded-md border border-line bg-white px-2 text-[13px] font-semibold text-[#111] ${
    compact ? "h-9 min-w-[180px]" : "mt-1 h-10 min-w-[220px]"
  }`;

  return (
    <div className={`flex flex-wrap items-end gap-2 ${compact ? "" : "gap-3"}`}>
      <label className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">
        {compact ? <span className="sr-only">Ödeme durumu</span> : "Ödeme durumu"}
        <select
          value={pay}
          onChange={(e) => setPay(e.target.value as (typeof PAYMENT_OPTIONS)[number])}
          className={selectClass}
        >
          {PAYMENT_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {PAYMENT_STATUS_LABEL[item]}
            </option>
          ))}
        </select>
      </label>
      {pay === "success" ? (
        <label className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">
          {compact ? <span className="sr-only">Kargo durumu</span> : "Kargo durumu"}
          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value as (typeof CARGO_STATUS_OPTIONS)[number])}
            className={selectClass}
          >
            {CARGO_STATUS_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {ORDER_STATUS_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button
        type="button"
        onClick={() => void save()}
        disabled={pending || !dirty}
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
