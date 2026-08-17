"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

export function HoldRevealPassword({
  value,
  onChange,
  autoComplete,
  className,
  placeholder,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  className?: string;
  placeholder?: string;
  name?: string;
}) {
  const [reveal, setReveal] = useState(false);

  function hide() {
    setReveal(false);
  }

  function show(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setReveal(true);
  }

  return (
    <span className="relative mt-1 block">
      <input
        name={name}
        type={reveal ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${className ?? ""} ${value ? "pr-11" : ""}`}
      />
      {value ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Şifreyi göster"
          onPointerDown={show}
          onPointerUp={hide}
          onPointerCancel={hide}
          onLostPointerCapture={hide}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded text-[#8b919a] select-none hover:text-navy"
        >
          <Eye className="size-4" />
        </button>
      ) : null}
    </span>
  );
}
