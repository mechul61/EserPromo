"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, Minus, Plus } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { PriceVatNote } from "@/components/pricing/PriceVatNote";
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
  sellable,
  maxQty,
  defaultEmail = "",
}: {
  productId: number;
  name: string;
  sku: string;
  unit: number;
  stock: number;
  qty: number;
  onQty: (qty: number) => void;
  sellable?: boolean;
  maxQty?: number;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"cart" | "buy" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(String(qty));
  const [editing, setEditing] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(defaultEmail);
  const [notifyPending, setNotifyPending] = useState(false);
  const [notifyDone, setNotifyDone] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const inStock = sellable ?? stock > 0;
  const limit = Math.max(0, maxQty ?? stock);
  const total = unit * qty;
  const inputValue = editing ? draft : String(qty);

  function clamp(next: number) {
    if (!Number.isFinite(next)) return 1;
    if (limit < 1) return 1;
    return Math.min(limit, Math.max(1, Math.trunc(next)));
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
    if (qty > limit) {
      setError(`Stokta ${stock} adet var`);
      return;
    }
    setPending(redirectTo ? "buy" : "cart");
    setError(null);
    try {
      const res = await fetch("/api/cart/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
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

  async function subscribeNotify(e: FormEvent) {
    e.preventDefault();
    setNotifyError(null);
    setNotifyPending(true);
    try {
      const res = await fetch(`/api/products/${productId}/stock-notify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email: notifyEmail }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNotifyError(data.error || "Kaydedilemedi");
        return;
      }
      setNotifyDone(true);
    } catch {
      setNotifyError("Bağlantı hatası");
    } finally {
      setNotifyPending(false);
    }
  }

  const wa = `${SITE_CONTACT.whatsappHref}?text=${encodeURIComponent(
    `Merhaba, ${sku} ${name} ürününden ${qty} adet sipariş vermek istiyorum.`,
  )}`;

  return (
    <aside className="flex h-full flex-col border border-[#e6e8ec] bg-white p-4">
      {inStock ? (
        <>
          <p className="text-[12px] font-extrabold tracking-wide text-[#111]">ADET</p>
          <p className="mt-1 text-[12px] text-[#6b7280]">Stok: {formatStock(stock)}</p>
          <div className="mt-2 flex h-12 items-center border border-[#d5d8de]">
            <button
              type="button"
              aria-label="Azalt"
              disabled={qty <= 1}
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
              max={limit || undefined}
              value={inputValue}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setEditing(true);
                setDraft(raw);
                if (raw === "") return;
                onQty(clamp(Number.parseInt(raw, 10)));
              }}
              onBlur={() => {
                const next = clamp(Number.parseInt(draft, 10));
                onQty(next);
                setDraft(String(next));
                setEditing(false);
              }}
              className="h-12 min-w-0 flex-1 border-x border-[#d5d8de] text-center text-[18px] font-bold outline-none"
            />
            <button
              type="button"
              aria-label="Artır"
              disabled={qty >= limit}
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
          <PriceVatNote />

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => submit()}
              className="flex h-12 items-center justify-center bg-orange text-[13px] font-extrabold tracking-wide text-white hover:bg-orange-hover disabled:opacity-60"
              style={{ color: "#ffffff" }}
            >
              {pending === "cart" ? "EKLENİYOR…" : "SEPETE EKLE"}
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => submit("/sepet")}
              className="flex h-12 items-center justify-center bg-brand-red text-[13px] font-extrabold tracking-wide text-white hover:bg-[#c41820] disabled:opacity-60"
              style={{ color: "#ffffff" }}
            >
              {pending === "buy" ? "YÖNLENDİRİLİYOR…" : "HEMEN SATIN AL"}
            </button>
          </div>
          {error ? <p className="mt-2 text-[12px] text-brand-red">{error}</p> : null}
        </>
      ) : (
        <div>
          <p className="text-[12px] font-extrabold tracking-wide text-[#111]">GELİNCE HABER VER</p>
          <p className="mt-1 text-[12px] leading-snug text-[#6b7280]">
            Ürün stoka girince e-posta ile bilgilendirelim.
          </p>
          {notifyDone ? (
            <p className="mt-3 rounded-sm border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-[13px] font-semibold text-[#166534]">
              Kaydınız alındı. Stok gelince haber vereceğiz.
            </p>
          ) : (
            <form onSubmit={subscribeNotify} className="mt-3 flex flex-col gap-2">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="E-posta adresiniz"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                className="h-11 border border-[#d5d8de] px-3 text-[14px] outline-none focus:border-navy"
              />
              <button
                type="submit"
                disabled={notifyPending}
                className="flex h-12 items-center justify-center gap-2 bg-navy text-[13px] font-extrabold tracking-wide text-white hover:bg-[#152a4a] disabled:opacity-60"
                style={{ color: "#ffffff" }}
              >
                <Bell className="size-4" />
                {notifyPending ? "KAYDEDİLİYOR…" : "GELİNCE HABER VER"}
              </button>
              {notifyError ? <p className="text-[12px] text-brand-red">{notifyError}</p> : null}
            </form>
          )}
        </div>
      )}

      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex h-[42px] items-center justify-center gap-2 rounded-lg bg-[#25D366] px-3 text-white transition hover:bg-[#20bd5a]"
        style={{ color: "#ffffff" }}
      >
        <WhatsAppIcon className="size-6 shrink-0" />
        <span className="flex min-w-0 flex-col leading-[1.1]">
          <span className="text-[9px] font-bold tracking-wide">WHATSAPP’TAN SİPARİŞ VER</span>
          <span className="text-[15px] font-extrabold tracking-wide">{SITE_CONTACT.whatsapp}</span>
        </span>
      </a>
    </aside>
  );
}
