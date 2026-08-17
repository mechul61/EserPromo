"use client";

import { useState } from "react";
import { bankInitials, bankLogoSrc, getBankBrand, getTurkeyBank } from "@/data/turkey-banks";

export function BankLogo({
  id,
  size = 40,
  className = "",
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const bank = getTurkeyBank(id);
  const src = bankLogoSrc(id);
  const brand = getBankBrand(id);
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white ${className}`}
        style={{ width: size, height: size }}
        title={bank?.short}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="size-full object-contain"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg font-extrabold ${className}`}
      style={{
        width: size,
        height: size,
        background: brand.bg,
        color: brand.fg,
        fontSize: size * 0.32,
      }}
      title={bank?.short}
      aria-hidden
    >
      {bankInitials(bank?.short ?? id)}
    </span>
  );
}
