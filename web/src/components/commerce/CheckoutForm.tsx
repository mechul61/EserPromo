"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  loggedIn: boolean;
  iyzicoReady: boolean;
};

export function CheckoutForm({ loggedIn, iyzicoReady }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!loggedIn) {
    return (
      <p className="mt-6 text-[14px]">
        Sipariş için{" "}
        <Link href="/giris" className="font-bold text-navy">
          giriş yapın
        </Link>{" "}
        veya{" "}
        <Link href="/kayit" className="font-bold text-navy">
          üye olun
        </Link>
        .
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          phone: form.get("phone"),
          city: form.get("city"),
          district: form.get("district"),
          line: form.get("line"),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        orderNumber?: string;
        iyzicoReady?: boolean;
      };
      if (!res.ok || !data.orderNumber) {
        setError(data.error || "Sipariş oluşturulamadı");
        return;
      }
      router.push(`/siparislerim/${data.orderNumber}`);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-3">
      <h2 className="text-[16px] font-extrabold text-navy">Teslimat</h2>
      <input name="fullName" required placeholder="Ad Soyad" className="h-11 w-full rounded-md border border-line px-3 text-sm" />
      <input name="phone" required placeholder="Telefon" className="h-11 w-full rounded-md border border-line px-3 text-sm" />
      <div className="grid grid-cols-2 gap-3">
        <input name="city" required placeholder="İl" className="h-11 rounded-md border border-line px-3 text-sm" />
        <input name="district" required placeholder="İlçe" className="h-11 rounded-md border border-line px-3 text-sm" />
      </div>
      <textarea name="line" required placeholder="Adres" className="h-24 w-full rounded-md border border-line px-3 py-2 text-sm" />
      {error ? <p className="text-[13px] text-brand-red">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-[#f5a623] px-6 text-[14px] font-bold text-[#111] disabled:opacity-60"
      >
        {pending ? "Oluşturuluyor…" : iyzicoReady ? "Ödemeye Geç" : "Siparişi Oluştur"}
      </button>
      {!iyzicoReady ? (
        <p className="text-[12px] text-muted">
          Iyzico anahtarları eklenince ödeme bu adımda açılacak. Kart bilgisi bu sitede tutulmaz.
        </p>
      ) : null}
    </form>
  );
}
