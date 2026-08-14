"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { formatPriceTry } from "@/lib/media";
import { bulkTiers, unitForQty } from "@/lib/product-detail";

export function ProductBuyBox({
  productId,
  name,
  sku,
  unitPrice,
  minQty = 100,
  stock,
  qty,
  onQty,
}: {
  productId: number;
  name: string;
  sku: string;
  unitPrice: number;
  minQty?: number;
  stock: number;
  qty: number;
  onQty: (qty: number) => void;
}) {
  const router = useRouter();
  const tiers = bulkTiers(unitPrice);
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unit = unitForQty(tiers, qty);
  const total = unit * qty;
  const inStock = stock > 0;

  function clamp(next: number) {
    return Math.min(10000, Math.max(minQty, next));
  }

  async function submit(redirectTo?: string) {
    if (!inStock) return;
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
      <div className="mt-2 flex h-12 items-center border border-[#d5d8de]">
        <button
          type="button"
          aria-label="Azalt"
          className="flex h-12 w-12 items-center justify-center text-[#333]"
          onClick={() => onQty(clamp(qty - 100))}
        >
          <Minus className="size-4" />
        </button>
        <input
          type="number"
          min={minQty}
          value={qty}
          onChange={(e) => onQty(clamp(Number(e.target.value) || minQty))}
          className="h-12 min-w-0 flex-1 border-x border-[#d5d8de] text-center text-[18px] font-bold outline-none"
        />
        <button
          type="button"
          aria-label="Artır"
          className="flex h-12 w-12 items-center justify-center text-[#333]"
          onClick={() => onQty(clamp(qty + 100))}
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
