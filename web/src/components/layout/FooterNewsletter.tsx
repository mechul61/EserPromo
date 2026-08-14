"use client";

import { useState } from "react";

export function FooterNewsletter() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="mt-3 text-[13px] text-white/80">E-bülten kaydınız alındı.</p>;
  }

  return (
    <form
      className="mt-3 flex h-10 overflow-hidden rounded-md"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <input
        type="email"
        required
        name="email"
        placeholder="E-posta adresiniz"
        className="min-w-0 flex-1 bg-white px-3 text-[13px] text-[#111] outline-none placeholder:text-[#9aa0a8]"
      />
      <button
        type="submit"
        className="shrink-0 bg-[#ff7b00] px-4 text-[12px] font-extrabold tracking-wide text-white hover:bg-[#e86e00]"
        style={{ color: "#ffffff" }}
      >
        GÖNDER
      </button>
    </form>
  );
}
