"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check } from "lucide-react";

type Tab = "aciklama" | "ozellik" | "baski";

export type OtherColor = {
  href: string;
  image: string;
  name: string;
  price: string;
};

function withBoldSku(text: string, sku?: string) {
  if (!sku || !text.includes(sku)) return text;
  const parts = text.split(sku);
  return parts.map((part, i) => (
    <span key={`${part}-${i}`}>
      {i > 0 ? <strong className="font-extrabold text-[#111]">{sku}</strong> : null}
      {part}
    </span>
  ));
}

export function ProductTabs({
  sku,
  heading,
  description,
  features,
  printArea,
  others,
}: {
  sku?: string;
  heading?: string;
  description: string;
  features: string[];
  printArea?: string;
  others: OtherColor[];
}) {
  const [tab, setTab] = useState<Tab>("aciklama");
  const items: Array<{ id: Tab; label: string }> = [
    { id: "aciklama", label: "ÜRÜN AÇIKLAMASI" },
    { id: "ozellik", label: "ÜRÜN ÖZELLİKLERİ" },
    { id: "baski", label: "BASKI ALANLARI" },
  ];

  const intro = description;
  const printLines = (printArea ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="mt-8">
      <div className="grid items-stretch gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="rounded-md border border-[#e6e8ec] bg-white px-4 pt-1 pb-5 sm:px-5">
          <div className="flex flex-wrap gap-x-1 border-b border-[#ececec]">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-2.5 py-2.5 text-left text-[12px] font-extrabold tracking-wide break-words sm:px-3 sm:text-[13px] ${
                  tab === item.id
                    ? "border-b-[3px] border-brand-red text-brand-red"
                    : "border-b-[3px] border-transparent text-[#111] hover:text-brand-red"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-5 text-[14px] leading-relaxed text-[#333]">
            {tab === "aciklama" ? (
              intro ? (
                <p>{withBoldSku(intro, sku)}</p>
              ) : (
                <p>
                  {heading
                    ? `${heading} logolu / baskılı promosyon ürünüdür. Teknik detaylar Ürün Özellikleri sekmesinde yer alır.`
                    : "Bu ürün için henüz açıklama eklenmedi."}
                </p>
              )
            ) : null}
            {tab === "ozellik" ? (
              features.length > 0 ? (
                <ul className="space-y-2.5">
                  {features.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#111]" strokeWidth={3} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Özellik bilgisi yakında eklenecek.</p>
              )
            ) : null}
            {tab === "baski" ? (
              printLines.length > 0 ? (
                <ul className="space-y-2.5">
                  {printLines.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-[#111]" strokeWidth={3} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Baskı alanı bilgisi ürün özelliklerinde yer alır.</p>
              )
            ) : null}
          </div>
        </section>

        <section className="rounded-md border border-[#e6e8ec] bg-white px-4 py-4 sm:px-5">
          <h2 className="text-[13px] font-extrabold tracking-wide text-[#111]">DİĞER RENKLER</h2>
          {others.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-6">
              {others.map((item) => (
                <Link key={item.href} href={item.href} className="text-center">
                  <span className="relative mx-auto block aspect-[1/2.4] w-full max-w-[72px]">
                    <Image src={item.image} alt={item.name} fill unoptimized className="object-contain" />
                  </span>
                  <span className="mt-2 block text-[12px] text-[#333]">{item.name}</span>
                  <span className="block text-[13px] font-extrabold text-[#111]">₺{item.price}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-[#6b7280]">Bu ürün için başka renk bulunmuyor.</p>
          )}
        </section>
      </div>
    </div>
  );
}
