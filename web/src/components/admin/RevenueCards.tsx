"use client";

import { useState } from "react";
import { RevenueOrdersGrid, type RevenueOrderRow } from "@/components/grid/AdminGrids";
import { formatPriceTry } from "@/lib/media";

export type { RevenueOrderRow };

type Tab = "collected" | "pending" | "lost";

export type RevenueTotals = {
  collected: number;
  collectedCount: number;
  collectedNet: number;
  collectedVat: number;
  pending: number;
  pendingCount: number;
  lost: number;
  lostCount: number;
  avgBasket: number;
};

export type RevenueChannel = { label: string; count: number; total: number };
export type RevenueMonth = { key: string; label: string; total: number };

function money(n: number) {
  return `₺${formatPriceTry(n)}`;
}

export function RevenueCards({
  totals,
  channels,
  months,
  collected,
  pending,
  lost,
}: {
  totals: RevenueTotals;
  channels: RevenueChannel[];
  months: RevenueMonth[];
  collected: RevenueOrderRow[];
  pending: RevenueOrderRow[];
  lost: RevenueOrderRow[];
}) {
  const [tab, setTab] = useState<Tab>("collected");
  const maxMonth = Math.max(1, ...months.map((row) => row.total));

  const lists: Record<Tab, { rows: RevenueOrderRow[]; empty: string }> = {
    collected: { rows: collected, empty: "Bu dönemde tahsil edilmiş sipariş yok." },
    pending: { rows: pending, empty: "Bekleyen ödeme yok." },
    lost: { rows: lost, empty: "İptal veya başarısız sipariş yok." },
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_1fr_1fr]">
        <button
          type="button"
          onClick={() => setTab("collected")}
          className={`rounded-md border bg-white p-5 text-left ${
            tab === "collected" ? "border-navy" : "border-line hover:border-navy"
          }`}
        >
          <p className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">Tahsil edilen</p>
          <p className="mt-2 text-[32px] font-extrabold leading-none text-navy">{money(totals.collected)}</p>
          <p className="mt-3 text-[13px] text-[#555]">
            {totals.collectedCount} sipariş
            {totals.collectedCount > 0 ? ` · Ortalama sepet ${money(totals.avgBasket)}` : ""}
          </p>
          <p className="mt-1 text-[12px] text-[#8b919a]">
            KDV hariç {money(totals.collectedNet)} · KDV {money(totals.collectedVat)}
          </p>
          {channels.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {channels.map((row) => (
                <span key={row.label} className="rounded-md bg-soft px-2.5 py-1 text-[12px] font-semibold text-navy">
                  {row.label} · {row.count} · {money(row.total)}
                </span>
              ))}
            </div>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`rounded-md border bg-white p-5 text-left ${
            tab === "pending" ? "border-orange" : "border-line hover:border-navy"
          }`}
        >
          <p className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">Bekleyen</p>
          <p className="mt-2 text-[22px] font-extrabold text-navy">{money(totals.pending)}</p>
          <p className="mt-2 text-[13px] text-[#555]">{totals.pendingCount} sipariş</p>
          <p className="mt-1 text-[12px] text-[#8b919a]">Ciroya dahil değil</p>
        </button>

        <button
          type="button"
          onClick={() => setTab("lost")}
          className={`rounded-md border bg-white p-5 text-left ${
            tab === "lost" ? "border-orange" : "border-line hover:border-navy"
          }`}
        >
          <p className="text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">İptal / başarısız</p>
          <p className="mt-2 text-[22px] font-extrabold text-navy">{money(totals.lost)}</p>
          <p className="mt-2 text-[13px] text-[#555]">{totals.lostCount} sipariş</p>
          <p className="mt-1 text-[12px] text-[#8b919a]">Ciroya dahil değil</p>
        </button>
      </div>

      <section className="rounded-md border border-line bg-white p-4">
        <h2 className="text-[13px] font-extrabold tracking-wide text-[#111] uppercase">Son 6 ay</h2>
        <ul className="mt-3 space-y-2">
          {months.map((row) => (
            <li key={row.key} className="grid grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-3 text-[13px]">
              <span className="capitalize text-[#555]">{row.label}</span>
              <span className="h-2 overflow-hidden rounded bg-soft">
                <span
                  className="block h-full rounded bg-navy"
                  style={{ width: `${Math.max(row.total > 0 ? 6 : 0, (row.total / maxMonth) * 100)}%` }}
                />
              </span>
              <span className="font-extrabold text-navy">{money(row.total)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "collected" as const, label: `Tahsil edilen (${totals.collectedCount})` },
              { id: "pending" as const, label: `Bekleyen (${totals.pendingCount})` },
              { id: "lost" as const, label: `İptal (${totals.lostCount})` },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-bold ${
                tab === item.id ? "bg-navy text-white" : "border border-line bg-white text-navy hover:border-orange"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <RevenueOrdersGrid rows={lists[tab].rows} emptyText={lists[tab].empty} />
      </section>
    </div>
  );
}
