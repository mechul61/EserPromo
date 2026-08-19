"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddToCartButton({ productId }: { productId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/cart/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Eklenemedi");
        return;
      }
      router.refresh();
      router.push("/sepet");
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={add}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-md bg-[#f5a623] px-6 py-3 text-[14px] font-bold text-[#111] hover:bg-orange-hover disabled:opacity-60"
      >
        {pending ? "Ekleniyor…" : "Sepete Ekle"}
      </button>
      {error ? <p className="mt-2 text-[13px] text-brand-red">{error}</p> : null}
    </div>
  );
}
