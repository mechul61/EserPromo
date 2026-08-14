"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { formatPriceTry, formatStock } from "@/lib/media";

export function ProductBuyBox({
  productId,
  name,
  sku,
  unit,
  stock,
  qty,
  onQty,
}: {
  productId: number;
  name: string;
  sku: string;
  unit: number;
  stock: number;
  qty: number;
  onQty: (qty: number) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(String(qty));
  const inStock = stock > 0;
  const maxQty = Math.max(0, stock);
  const total = unit * qty;

  useEffect(() => {
    setDraft(String(qty));
  }, [qty]);

  function clamp(next: number) {
    if (!Number.isFinite(next)) return 1;
    if (maxQty < 1) return 1;
    return Math.min(maxQty, Math.max(1, Math.trunc(next)));
  }

  async function submit(redirectTo?: string) {
    if (!inStock) {
      setError("Bu ürün stokta yok");
      return;
    }
    if (qty < 1) {
      setError("Adet en az 1 olmalı");
      return;
    }
    if (qty > stock) {
      setError(`Stokta ${stock} adet var`);
      return;
    }
    setPending(redirectTo ? "buy" : "cart");
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Eklenemedi");
        return;
      }
      router.refresh();
      router.push(redirectTo ?? "/sepet");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(null);
    }
  }

  const wa = `${SITE_CONTACT.whatsappHref}?text=${encodeURIComponent(
    `Merhaba, ${sku} ${name} ürününden ${qty} adet sipariş vermek istiyorum.`,
  )}`;

  return (
    <aside className="flex h-full flex-col border border-[#e6e8ec] bg-white p-4">
      <p className="text-[12px] font-extrabold tracking-wide text-[#111]">ADET</p>
      <p className="mt-1 text-[12px] text-[#6b7280]">Stok: {formatStock(stock)}</p>
      <div className="mt-2 flex h-12 items-center border border-[#d5d8de]">
        <button
          type="button"
          aria-label="Azalt"
          disabled={!inStock || qty <= 1}
          className="flex h-12 w-12 items-center justify-center text-[#333] disabled:opacity-40"
          onClick={() => onQty(clamp(qty - 1))}
        >
          <Minus className="size-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          min={1}
          max={maxQty || undefined}
          value={draft}
          disabled={!inStock}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            setDraft(raw);
            if (raw === "") return;
            onQty(clamp(Number.parseInt(raw, 10)));
          }}
          onBlur={() => {
            const next = clamp(Number.parseInt(draft, 10));
            onQty(next);
            setDraft(String(next));
          }}
          className="h-12 min-w-0 flex-1 border-x border-[#d5d8de] text-center text-[18px] font-bold outline-none disabled:bg-[#f7f8fa]"
        />
        <button
          type="button"
          aria-label="Artır"
          disabled={!inStock || qty >= maxQty}
          className="flex h-12 w-12 items-center justify-center text-[#333] disabled:opacity-40"
          onClick={() => onQty(clamp(qty + 1))}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <p className="mt-4 text-[12px] font-extrabold tracking-wide text-[#111]">TOPLAM FİYAT</p>
      <p className="mt-1 text-[24px] leading-none font-extrabold text-[#111]">
        ₺{formatPriceTry(total)}
      </p>
      <p className="mt-1 text-[12px] text-[#8b919a]">KDV Dahil</p>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={!inStock || pending !== null}
          onClick={() => submit()}
          className="flex h-12 items-center justify-center bg-orange text-[13px] font-extrabold tracking-wide text-white hover:bg-orange-hover disabled:opacity-60"
          style={{ color: "#ffffff" }}
        >
          {pending === "cart" ? "EKLENİYOR…" : "SEPETE EKLE"}
        </button>
        <button
          type="button"
          disabled={!inStock || pending !== null}
          onClick={() => submit("/sepet")}
          className="flex h-12 items-center justify-center bg-brand-red text-[13px] font-extrabold tracking-wide text-white hover:bg-[#c41820] disabled:opacity-60"
          style={{ color: "#ffffff" }}
        >
          {pending === "buy" ? "YÖNLENDİRİLİYOR…" : "HEMEN SATIN AL"}
        </button>
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-[42px] items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 text-white transition hover:bg-[#20bd5a]"
          style={{ color: "#ffffff" }}
        >
          <WhatsAppIcon className="size-6 shrink-0" />
          <span className="flex min-w-0 flex-col leading-[1.1]">
            <span className="text-[9px] font-bold tracking-wide">WHATSAPP’TAN SİPARİŞ VER</span>
            <span className="text-[15px] font-extrabold tracking-wide">{SITE_CONTACT.whatsapp}</span>
          </span>
        </a>
      </div>
      {error ? <p className="mt-2 text-[12px] text-brand-red">{error}</p> : null}
    </aside>
  );
}
