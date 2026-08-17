"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { IBAN_MASK, sanitizeTrIbanInput } from "@/data/turkey-banks";

export function IbanInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  function moveCaret(el: HTMLInputElement, formatted: string, rawBefore: number) {
    const kept = Math.max(2, Math.min(rawBefore, 26));
    let pos = 0;
    let seen = 0;
    while (pos < formatted.length && seen < kept) {
      if (formatted[pos] !== " ") seen += 1;
      pos += 1;
    }
    requestAnimationFrame(() => el.setSelectionRange(pos, pos));
  }

  function onIbanChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const rawBefore = el.value.slice(0, caret).replace(/[^A-Za-z0-9]/g, "").length;
    const formatted = sanitizeTrIbanInput(el.value);
    onChange(formatted);
    moveCaret(el, formatted, rawBefore);
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const formatted = sanitizeTrIbanInput(e.clipboardData.getData("text"));
    onChange(formatted);
    requestAnimationFrame(() => {
      const el = e.currentTarget;
      el.setSelectionRange(formatted.length, formatted.length);
    });
  }

  function guardPrefix(e: React.KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if ((e.key === "Backspace" || e.key === "Delete") && start < 2 && end <= 2) {
      e.preventDefault();
    }
    if (e.key === "Backspace" && start <= 2 && end <= 2) {
      e.preventDefault();
    }
    if (e.key === "ArrowLeft" && start <= 2) {
      e.preventDefault();
      el.setSelectionRange(2, 2);
    }
    if (e.key === "Home") {
      e.preventDefault();
      el.setSelectionRange(2, 2);
    }
  }

  async function copy() {
    const raw = value.replace(/[^A-Za-z0-9]/g, "");
    if (raw.length < 3) return;
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative mt-1">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center px-3 pr-11">
        <span className="whitespace-pre font-mono text-[13px] tracking-wide">
          {IBAN_MASK.split("").map((ch, i) => (
            <span key={i} className={i < value.length ? "text-navy" : "text-[#c5c9d0]"}>
              {i < value.length ? value[i] : ch}
            </span>
          ))}
        </span>
      </div>
      <input
        value={value}
        onChange={onIbanChange}
        onPaste={onPaste}
        onKeyDown={guardPrefix}
        onClick={(e) => {
          const el = e.currentTarget;
          if ((el.selectionStart ?? 0) < 2) el.setSelectionRange(2, 2);
        }}
        onFocus={(e) => {
          const el = e.currentTarget;
          if (!value.startsWith("TR")) onChange(sanitizeTrIbanInput(value));
          requestAnimationFrame(() => {
            if ((el.selectionStart ?? 0) < 2) el.setSelectionRange(Math.max(value.length, 2), Math.max(value.length, 2));
          });
        }}
        required
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        className="relative h-11 w-full rounded-md border border-line bg-transparent px-3 pr-11 font-mono text-[13px] tracking-wide text-transparent caret-navy outline-none focus:border-navy"
      />
      <button
        type="button"
        onClick={() => void copy()}
        title={copied ? "Kopyalandı" : "Kopyala"}
        aria-label={copied ? "Kopyalandı" : "IBAN kopyala"}
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-navy hover:bg-soft"
      >
        {copied ? <Check className="size-4 text-[#1f9d55]" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
