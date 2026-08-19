"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { CartLinesGrid } from "@/components/grid/AdminGrids";
import { formatPriceTry } from "@/lib/media";

export type CartLine = {
  id: string;
  name: string;
  sku: string;
  href: string;
  quantity: number;
  vatRate: number;
  subtotal: number;
  vat: number;
  grand: number;
  image: string;
};

type CardId = "lines" | "qty" | "net" | "vat" | "total";

function money(n: number) {
  return `₺${formatPriceTry(n)}`;
}

export function CartDetailView({
  updatedAt,
  lines,
}: {
  updatedAt: string;
  lines: CartLine[];
}) {
  const [open, setOpen] = useState<CardId | "item" | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const titleId = useId();
  const item = lines.find((line) => line.id === itemId) ?? null;

  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const vat = lines.reduce((sum, line) => sum + line.vat, 0);
  const grand = lines.reduce((sum, line) => sum + line.grand, 0);
  const quantity = lines.reduce((sum, line) => sum + line.quantity, 0);

  const cards: Array<{ id: CardId; label: string; value: string; hint: string }> = [
    { id: "lines", label: "Ürün kalemi", value: String(lines.length), hint: "Sepetteki çeşit" },
    { id: "qty", label: "Toplam adet", value: quantity.toLocaleString("tr-TR"), hint: "Parça sayısı" },
    { id: "net", label: "Ara toplam", value: money(subtotal), hint: "KDV hariç" },
    { id: "vat", label: "KDV", value: money(vat), hint: "Tahmini KDV" },
    { id: "total", label: "Genel toplam", value: money(grand), hint: "Müşterinin göreceği tutar" },
  ];

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(null);
        setItemId(null);
      }
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(null);
    setItemId(null);
  }

  const amount = (line: CartLine) => {
    if (open === "qty") return line.quantity;
    if (open === "net") return line.subtotal;
    if (open === "vat") return line.vat;
    return line.grand;
  };

  const dialogTitle =
    open === "item"
      ? item?.name ?? "Ürün"
      : cards.find((card) => card.id === open)?.label ?? "Detay";

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
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

      <section>
        <CartLinesGrid
          rows={lines.map((line) => ({
            id: line.id,
            name: line.name,
            sku: line.sku,
            quantity: line.quantity,
            total: line.grand,
          }))}
          onRowClick={(row) => {
            setItemId(row.id);
            setOpen("item");
          }}
        />
        <div className="mt-0 flex justify-between rounded-b-md border border-t-0 border-line bg-white px-4 py-3 text-[13px]">
          <span className="text-[#6b7280]">{updatedAt} güncellendi</span>
          <span className="font-extrabold text-navy">Toplam {money(grand)}</span>
        </div>
      </section>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-line bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
              <h2 id={titleId} className="text-[15px] font-extrabold tracking-wide text-navy uppercase">
                {dialogTitle}
              </h2>
              <button
                type="button"
                onClick={close}
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-navy hover:bg-soft"
                aria-label="Kapat"
              >
                <X className="size-5" />
              </button>
            </div>

            {open === "item" && item ? (
              <div className="overflow-auto p-4">
                <div className="flex items-start gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded border border-line bg-soft">
                    <Image src={item.image} alt="" fill unoptimized className="object-contain p-1" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-navy">{item.name}</p>
                    <p className="mt-1 text-[12px] text-[#6b7280]">SKU {item.sku}</p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-[13px] sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">Adet</dt>
                    <dd className="mt-0.5 font-semibold">{item.quantity.toLocaleString("tr-TR")}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">KDV</dt>
                    <dd className="mt-0.5 font-semibold">%{item.vatRate}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">KDV hariç</dt>
                    <dd className="mt-0.5 font-semibold">{money(item.subtotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">KDV tutarı</dt>
                    <dd className="mt-0.5 font-semibold">{money(item.vat)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">Satır toplamı</dt>
                    <dd className="mt-0.5 text-[18px] font-extrabold text-navy">{money(item.grand)}</dd>
                  </div>
                </dl>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-md bg-navy px-4 text-[13px] font-extrabold tracking-wide text-white hover:bg-navy-deep"
                >
                  Sitede gör
                  <ExternalLink className="size-4" />
                </Link>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto p-4">
                <CartLinesGrid
                  rows={lines.map((line) => ({
                    id: line.id,
                    name: line.name,
                    sku: line.sku,
                    quantity: line.quantity,
                    total: typeof amount(line) === "number" ? Number(amount(line)) : line.grand,
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
