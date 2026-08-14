"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { formatPriceTry } from "@/lib/media";
import { grossPrice } from "@/lib/product-detail";

export type CartLineView = {
  productId: number;
  href: string;
  name: string;
  sku: string;
  color: string | null;
  size: string | null;
  image: string;
  unitNet: number;
  vatRate: number;
  quantity: number;
  stock: number;
};

function money(n: number) {
  return `₺${formatPriceTry(n)}`;
}

export function CartView({ items }: { items: CartLineView[] }) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<number, number>>(() =>
    Object.fromEntries(items.map((item) => [item.productId, item.quantity])),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = useMemo(
    () => items.filter((item) => (qty[item.productId] ?? item.quantity) > 0),
    [items, qty],
  );

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    for (const item of lines) {
      const quantity = qty[item.productId] ?? item.quantity;
      const net = item.unitNet * quantity;
      subtotal += net;
      vat += net * (item.vatRate / 100);
    }
    const vatRates = [...new Set(lines.map((item) => item.vatRate))];
    return {
      subtotal,
      vat,
      grand: subtotal + vat,
      vatLabel: vatRates.length === 1 ? `KDV (%${vatRates[0]})` : "KDV",
      count: lines.length,
    };
  }, [lines, qty]);

  function bump(productId: number, stock: number, delta: number) {
    setQty((prev) => {
      const current = prev[productId] ?? 1;
      const next = Math.min(stock, Math.max(1, current + delta));
      return { ...prev, [productId]: next };
    });
  }

  async function patchOne(productId: number, quantity: number) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Güncellenemedi");
        return;
      }
      if (quantity < 1) {
        setQty((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  async function saveAll() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: qty[item.productId] ?? item.quantity,
          })),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Sepet güncellenemedi");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Bağlantı hatası");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function clearAll() {
    if (!confirm("Sepetteki tüm ürünler silinsin mi?")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/cart", { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Sepet temizlenemedi");
        return;
      }
      setQty({});
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  async function goCheckout() {
    const ok = await saveAll();
    if (ok) router.push("/odeme");
  }

  const waText = encodeURIComponent(
    [
      "Merhaba, sepetimdeki ürünler için toplu sipariş teklifi almak istiyorum.",
      ...lines.map((item) => {
        const quantity = qty[item.productId] ?? item.quantity;
        return `• ${item.sku} ${item.name} — ${quantity} adet`;
      }),
    ].join("\n"),
  );

  if (items.length === 0 || lines.length === 0) {
    return (
      <div className="rounded-md border border-line bg-white px-6 py-16 text-center">
        <h1 className="text-[22px] font-extrabold tracking-wide text-[#111] uppercase">
          Sepetim (0 Ürün)
        </h1>
        <p className="mt-2 text-[14px] text-[#8b919a]">Alışveriş sepetiniz boş.</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-md border border-line px-4 text-[13px] font-bold text-navy hover:bg-soft"
        >
          <ArrowLeft className="size-4" />
          Alışverişe Devam Et
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
      <section className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[26px] leading-none font-extrabold tracking-wide text-[#111] uppercase">
              Sepetim ({totals.count} Ürün)
            </h1>
            <p className="mt-2 text-[13px] text-[#8b919a]">
              Alışveriş sepetinizde {totals.count} ürün bulunmaktadır.
            </p>
          </div>
          <button
            type="button"
            onClick={clearAll}
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3.5 text-[12px] font-bold tracking-wide text-[#555] hover:border-[#ccc] hover:text-navy disabled:opacity-60"
          >
            <Trash2 className="size-4" />
            Sepeti Temizle
          </button>
        </div>

        {error ? <p className="mb-3 text-[13px] text-brand-red">{error}</p> : null}

        <div className="overflow-hidden rounded-md border border-line bg-white">
          <div className="hidden grid-cols-[minmax(0,1fr)_120px_150px_120px_36px] gap-3 border-b border-line bg-[#f7f8fa] px-4 py-2.5 text-[11px] font-extrabold tracking-wide text-[#777] uppercase md:grid">
            <span>Ürün</span>
            <span className="text-right">Birim Fiyat</span>
            <span className="text-center">Adet</span>
            <span className="text-right">Toplam</span>
            <span />
          </div>

          <ul className="divide-y divide-line">
            {lines.map((item) => {
              const quantity = qty[item.productId] ?? item.quantity;
              const unitGross = grossPrice(item.unitNet, item.vatRate);
              const lineGross = unitGross * quantity;
              return (
                <li
                  key={item.productId}
                  className="grid grid-cols-1 items-center gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_120px_150px_120px_36px]"
                >
                  <Link href={item.href} className="flex min-w-0 items-center gap-3">
                    <div className="relative size-[72px] shrink-0 overflow-hidden rounded border border-line bg-soft">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold text-[#1a1a1a]">{item.name}</p>
                      <p className="mt-0.5 text-[12px] text-[#8b919a]">
                        {item.color ? `Renk: ${item.color}` : `Stok kodu: ${item.sku}`}
                        {item.size ? ` · Ebat: ${item.size}` : ""}
                      </p>
                    </div>
                  </Link>

                  <p className="text-[14px] font-semibold text-[#222] md:text-right">
                    <span className="mr-2 text-[11px] font-bold tracking-wide text-[#8b919a] uppercase md:hidden">
                      Birim
                    </span>
                    {money(unitGross)}
                  </p>

                  <div className="flex justify-start md:justify-center">
                    <div className="inline-flex overflow-hidden rounded border border-line">
                      <button
                        type="button"
                        aria-label="Azalt"
                        disabled={pending || quantity <= 1}
                        onClick={() => bump(item.productId, item.stock, -1)}
                        className="flex w-8 items-center justify-center text-[#666] hover:bg-soft disabled:opacity-40"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <label className="flex w-[64px] flex-col items-center justify-center border-x border-line py-1">
                        <input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={quantity}
                          onChange={(e) => {
                            const next = Number.parseInt(e.target.value, 10);
                            if (!Number.isFinite(next)) return;
                            setQty((prev) => ({
                              ...prev,
                              [item.productId]: Math.min(item.stock, Math.max(1, next)),
                            }));
                          }}
                          className="w-full bg-transparent text-center text-[14px] font-bold text-[#111] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <span className="text-[10px] leading-none text-[#8b919a]">adet</span>
                      </label>
                      <button
                        type="button"
                        aria-label="Artır"
                        disabled={pending || quantity >= item.stock}
                        onClick={() => bump(item.productId, item.stock, 1)}
                        className="flex w-8 items-center justify-center text-[#666] hover:bg-soft disabled:opacity-40"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[15px] font-extrabold text-navy md:text-right">
                    <span className="mr-2 text-[11px] font-bold tracking-wide text-[#8b919a] uppercase md:hidden">
                      Toplam
                    </span>
                    {money(lineGross)}
                  </p>

                  <button
                    type="button"
                    aria-label="Ürünü sil"
                    disabled={pending}
                    onClick={() => patchOne(item.productId, 0)}
                    className="justify-self-end text-[#b0b4ba] hover:text-brand-red disabled:opacity-40 md:justify-self-center"
                  >
                    <X className="size-4" strokeWidth={2.5} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-white px-4 text-[12px] font-extrabold tracking-wide text-navy hover:bg-soft"
          >
            <ArrowLeft className="size-4" />
            Alışverişe Devam Et
          </Link>
          <button
            type="button"
            onClick={() => void saveAll()}
            disabled={pending}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-white px-4 text-[12px] font-extrabold tracking-wide text-navy hover:bg-soft disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} />
            Sepeti Güncelle
          </button>
        </div>
      </section>

      <aside className="w-full shrink-0 xl:w-[300px]">
        <div className="rounded-md border border-line bg-white p-5">
          <h2 className="text-[15px] font-extrabold tracking-wide text-[#111] uppercase">
            Sipariş Özeti
          </h2>
          <dl className="mt-4 space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-[#666]">Ara Toplam</dt>
              <dd className="font-semibold">{money(totals.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[#666]">{totals.vatLabel}</dt>
              <dd className="font-semibold">{money(totals.vat)}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-line pb-3">
              <dt className="text-[#666]">Kargo</dt>
              <dd className="font-semibold text-brand-green">Ücretsiz</dd>
            </div>
            <div className="pt-1">
              <div className="flex items-end justify-between gap-3">
                <dt className="text-[12px] font-extrabold tracking-wide text-[#111] uppercase">
                  Genel Toplam
                </dt>
                <dd className="text-[20px] leading-none font-extrabold text-navy">
                  {money(totals.grand)}
                </dd>
              </div>
              <p className="mt-1 text-right text-[11px] text-[#8b919a]">KDV Dahil</p>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => void goCheckout()}
            disabled={pending}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-orange text-[14px] font-extrabold tracking-wide text-[#111] hover:bg-orange-hover disabled:opacity-60"
          >
            Devam Et
            <ArrowRight className="size-4" />
          </button>

          <ul className="mt-4 space-y-2 text-[11px] text-[#6b7280]">
            <li className="flex items-center gap-2">
              <Lock className="size-3.5 text-navy" />
              256 Bit SSL ile Güvenli Alışveriş
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-navy" />
              3D Secure ile Güvenli Ödeme
            </li>
          </ul>
        </div>

        <div className="mt-4 rounded-md border border-[#d7e8f6] bg-[#eef6fb] p-5">
          <h3 className="text-[13px] font-extrabold tracking-wide text-navy uppercase">
            Toplu Sipariş mi Veriyorsunuz?
          </h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#445]">
            Yüksek adet ve özel fiyat için bize ulaşın; sepetinizdeki ürünler için teklif
            hazırlayalım.
          </p>
          <a
            href={`${SITE_CONTACT.whatsappHref}?text=${waText}`}
            className="mt-4 flex h-11 items-center justify-center gap-2 rounded-md bg-white text-[12px] font-extrabold tracking-wide text-[#128C7E] shadow-sm hover:bg-[#f7fffb]"
          >
            <WhatsAppIcon className="size-4 text-[#25D366]" />
            WhatsApp’tan Teklif Al
          </a>
        </div>
      </aside>
    </div>
  );
}
