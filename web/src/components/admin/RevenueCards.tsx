"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, X } from "lucide-react";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { formatPriceTry } from "@/lib/media";

export type RevenueOrderRow = {
  id: string;
  publicNumber: string;
  userId: string;
  createdAt: string;
  paidAt: string | null;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  subtotal: number;
  vatTotal: number;
  customer: string;
  email: string;
  phone: string;
  payment: string;
};

export type RevenueCardId = "collected" | "pending" | "lost" | "exvat" | "vat" | "avg";

type Card = {
  id: RevenueCardId;
  label: string;
  value: string;
  hint: string;
};

function tryMoney(n: number) {
  return `₺${formatPriceTry(n)}`;
}

function amountFor(id: RevenueCardId, order: RevenueOrderRow) {
  if (id === "exvat") return order.subtotal;
  if (id === "vat") return order.vatTotal;
  return order.grandTotal;
}

export function RevenueCards({
  cards,
  collected,
  pending,
  lost,
}: {
  cards: Card[];
  collected: RevenueOrderRow[];
  pending: RevenueOrderRow[];
  lost: RevenueOrderRow[];
}) {
  const [open, setOpen] = useState<RevenueCardId | null>(null);
  const [q, setQ] = useState("");
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    setQ("");
  }, [open]);

  const collectedTotal = collected.reduce((sum, row) => sum + row.grandTotal, 0);
  const collectedNet = collected.reduce((sum, row) => sum + row.subtotal, 0);
  const collectedVat = collected.reduce((sum, row) => sum + row.vatTotal, 0);
  const pendingTotal = pending.reduce((sum, row) => sum + row.grandTotal, 0);
  const lostTotal = lost.reduce((sum, row) => sum + row.grandTotal, 0);
  const avg = collected.length > 0 ? collectedTotal / collected.length : 0;

  const meta = open
    ? {
        collected: {
          title: "Tahsil edilen ciro",
          note: "Ödenen siparişler. Ödeme durumunu buradan değiştirebilirsiniz.",
          orders: collected,
          summary: [
            { label: "Sipariş", value: String(collected.length) },
            { label: "Ciro", value: tryMoney(collectedTotal) },
            { label: "KDV hariç", value: tryMoney(collectedNet) },
            { label: "KDV", value: tryMoney(collectedVat) },
          ],
        },
        pending: {
          title: "Bekleyen tahsilat",
          note: "Ödeme bekleyen siparişler ciroya dahil değil. Ödeme alındı işaretleyince ciroya girer.",
          orders: pending,
          summary: [
            { label: "Sipariş", value: String(pending.length) },
            { label: "Bekleyen", value: tryMoney(pendingTotal) },
          ],
        },
        lost: {
          title: "İptal / başarısız",
          note: "Ciroya dahil değil. Ödeme alındı derseniz sipariş tekrar ciroya alınır.",
          orders: lost,
          summary: [
            { label: "Sipariş", value: String(lost.length) },
            { label: "Tutar", value: tryMoney(lostTotal) },
          ],
        },
        exvat: {
          title: "KDV hariç",
          note: "Tahsil edilen siparişlerin net tutarı.",
          orders: collected,
          summary: [
            { label: "Sipariş", value: String(collected.length) },
            { label: "KDV hariç", value: tryMoney(collectedNet) },
            { label: "KDV", value: tryMoney(collectedVat) },
            { label: "Genel", value: tryMoney(collectedTotal) },
          ],
        },
        vat: {
          title: "KDV",
          note: "Tahsil edilen siparişlerdeki KDV.",
          orders: collected,
          summary: [
            { label: "Sipariş", value: String(collected.length) },
            { label: "KDV", value: tryMoney(collectedVat) },
            { label: "KDV hariç", value: tryMoney(collectedNet) },
            { label: "Genel", value: tryMoney(collectedTotal) },
          ],
        },
        avg: {
          title: "Ortalama sepet",
          note:
            collected.length > 0
              ? `Hesap: ${tryMoney(collectedTotal)} ÷ ${collected.length} sipariş = ${tryMoney(avg)}.`
              : "Tahsil edilen sipariş yok.",
          orders: collected,
          summary: [
            { label: "Sipariş", value: String(collected.length) },
            { label: "Ciro", value: tryMoney(collectedTotal) },
            { label: "Ortalama", value: tryMoney(avg) },
          ],
        },
      }[open]
    : null;

  const filtered = useMemo(() => {
    if (!meta) return [];
    const needle = q.trim().toLocaleLowerCase("tr");
    if (!needle) return meta.orders;
    return meta.orders.filter((order) =>
      [order.publicNumber, order.customer, order.email, order.phone, order.payment]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(needle),
    );
  }, [meta, q]);

  const channels = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const order of filtered) {
      const key = order.payment || "—";
      const row = map.get(key) ?? { count: 0, total: 0 };
      row.count += 1;
      row.total += amountFor(open ?? "collected", order);
      map.set(key, row);
    }
    return [...map.entries()];
  }, [filtered, open]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setOpen(card.id)}
            className="rounded-md border border-line bg-white p-4 text-left transition hover:border-orange focus:border-orange focus:outline-none active:bg-soft"
          >
            <p className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">{card.label}</p>
            <p className="mt-2 text-[18px] font-extrabold text-navy">{card.value}</p>
            <p className="mt-1 text-[11px] text-[#8b919a]">{card.hint}</p>
            <p className="mt-2 text-[11px] font-bold text-navy">Detay</p>
          </button>
        ))}
      </div>

      {open && meta ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-soft" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <header className="border-b border-line bg-white px-4 py-3 lg:px-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="mb-2 inline-flex items-center gap-1 text-[13px] font-bold text-navy hover:text-orange"
                >
                  <ArrowLeft className="size-4" />
                  Ciroya dön
                </button>
                <h2 id={titleId} className="text-[20px] font-extrabold tracking-wide text-navy uppercase">
                  {meta.title}
                </h2>
                <p className="mt-1 text-[13px] text-[#6b7280]">{meta.note}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="flex size-10 shrink-0 items-center justify-center rounded-md border border-line text-navy hover:bg-soft"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {meta.summary.map((item) => (
                <div key={item.label} className="rounded-md border border-line bg-soft px-3 py-2.5">
                  <p className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">{item.label}</p>
                  <p className="mt-1 text-[18px] font-extrabold text-navy">{item.value}</p>
                </div>
              ))}
            </div>
            {channels.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {channels.map(([name, row]) => (
                  <span key={name} className="rounded-md border border-line bg-white px-2.5 py-1 text-[12px] font-semibold text-navy">
                    {name}: {row.count} · {tryMoney(row.total)}
                  </span>
                ))}
              </div>
            ) : null}
            <label className="relative mt-4 block max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b919a]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Sipariş no, müşteri, e-posta"
                className="h-11 w-full rounded-md border border-line bg-white pr-3 pl-10 text-[13px] outline-none focus:border-navy"
              />
            </label>
          </header>

          <div className="min-h-0 flex-1 overflow-auto px-4 py-4 lg:px-8">
            {filtered.length === 0 ? (
              <p className="rounded-md border border-line bg-white p-6 text-[13px] text-[#6b7280]">Kayıt yok.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-line bg-white">
                <table className="w-full min-w-[1100px] text-left text-[13px]">
                  <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
                    <tr>
                      <th className="px-4 py-2">No</th>
                      <th className="px-4 py-2">Müşteri</th>
                      <th className="px-4 py-2">Kanal</th>
                      <th className="px-4 py-2">KDV hariç</th>
                      <th className="px-4 py-2">KDV</th>
                      <th className="px-4 py-2">Tutar</th>
                      <th className="px-4 py-2">Tarih</th>
                      <th className="px-4 py-2">Ödeme durumu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order) => (
                      <tr key={order.id} className="border-b border-line align-top last:border-b-0">
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/siparisler/${order.publicNumber}`}
                            className="font-extrabold text-navy hover:text-orange"
                          >
                            {order.publicNumber}
                          </Link>
                          <div className="mt-1">
                            <StatusBadge status={order.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/musteriler/${order.userId}`} className="font-semibold hover:text-orange">
                            {order.customer}
                          </Link>
                          <p className="text-[12px] text-[#6b7280]">{order.email}</p>
                          {order.phone ? <p className="text-[12px] text-[#6b7280]">{order.phone}</p> : null}
                        </td>
                        <td className="px-4 py-3">{order.payment}</td>
                        <td className="px-4 py-3">{tryMoney(order.subtotal)}</td>
                        <td className="px-4 py-3">{tryMoney(order.vatTotal)}</td>
                        <td className="px-4 py-3 font-extrabold">{tryMoney(amountFor(open, order))}</td>
                        <td className="px-4 py-3 text-[#6b7280]">
                          {formatDateTimeTr(order.createdAt)}
                          {order.paidAt ? (
                            <p className="text-[11px]">Ödeme: {formatDateTimeTr(order.paidAt)}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusForm
                            compact
                            orderId={order.id}
                            status={order.status}
                            paymentStatus={order.paymentStatus}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
