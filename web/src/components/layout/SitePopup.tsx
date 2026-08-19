"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

type ActivePopup = {
  id: string;
  kind: "subscribe" | "promo" | "info";
  title: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  couponCode: string;
  image: string;
  device: "all" | "desktop" | "mobile";
  audience: "all" | "new_visitors" | "returning" | "logged_in";
  delaySeconds: number;
  frequencyHours: number;
};

function seenKey(id: string) {
  return `eserpromo-popup-${id}`;
}

function visitorKey() {
  return "eserpromo-visited";
}

function deviceOk(device: ActivePopup["device"]) {
  if (device === "all") return true;
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  return device === "mobile" ? mobile : !mobile;
}

function audienceOk(audience: ActivePopup["audience"]) {
  if (audience === "all" || audience === "logged_in") return true;
  const returning = Boolean(window.localStorage.getItem(visitorKey()));
  if (audience === "new_visitors") return !returning;
  if (audience === "returning") return returning;
  return true;
}

function recentlySeen(id: string, hours: number) {
  if (hours <= 0) return false;
  const raw = window.localStorage.getItem(seenKey(id));
  if (!raw) return false;
  const at = Number(raw);
  if (!Number.isFinite(at)) return false;
  return Date.now() - at < hours * 60 * 60 * 1000;
}

function markSeen(id: string) {
  window.localStorage.setItem(seenKey(id), String(Date.now()));
  window.localStorage.setItem(visitorKey(), "1");
}

async function track(id: string, type: "view" | "click" | "convert") {
  await fetch(`/api/popups/${id}/event/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
  }).catch(() => null);
}

export function SitePopup() {
  const pathname = usePathname();
  const [popup, setPopup] = useState<ActivePopup | null>(null);
  const [popupPath, setPopupPath] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer = 0;
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/popups/current/?path=${encodeURIComponent(pathname || "/")}`);
      const data = (await res.json()) as { popup?: ActivePopup | null };
      const next = data.popup ?? null;
      if (cancelled || !next) return;
      if (!deviceOk(next.device) || !audienceOk(next.audience) || recentlySeen(next.id, next.frequencyHours)) {
        window.localStorage.setItem(visitorKey(), "1");
        return;
      }
      setPopup(next);
      setPopupPath(pathname || "/");
      timer = window.setTimeout(() => {
        setEmail("");
        setDone(false);
        setError(null);
        setOpen(true);
        markSeen(next.id);
        void track(next.id, "view");
      }, Math.max(0, next.delaySeconds) * 1000);
    }

    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname]);

  if (!popup || !open || popupPath !== (pathname || "/")) return null;

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/popups/subscribe/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, popupId: popup!.id }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error || "Kayıt alınamadı");
      return;
    }
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-[#64748b] hover:bg-[#f8fafc]"
          aria-label="Kapat"
        >
          <X className="size-4" />
        </button>
        <p className="text-[26px] font-black tracking-wide text-[#7c3aed]">{popup.heading}</p>
        <p className="mt-2 text-[14px] text-[#475569]">{popup.body}</p>
        {popup.couponCode ? <p className="mt-3 text-[12px] font-bold text-[#0f172a]">Kod: {popup.couponCode}</p> : null}
        {popup.kind === "subscribe" ? (
          done ? (
            <p className="mt-5 text-[14px] font-semibold text-[#16a34a]">Kaydınız alındı. Teşekkürler.</p>
          ) : (
            <form className="mt-5 space-y-3" onSubmit={(e) => void subscribe(e)}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="h-11 w-full rounded-lg border border-[#e8edf3] px-3 text-[13px] outline-none"
              />
              {error ? <p className="text-[12px] font-semibold text-[#dc2626]">{error}</p> : null}
              <button type="submit" className="h-11 w-full rounded-lg bg-[#7c3aed] text-[14px] font-bold text-white">
                {popup.ctaLabel}
              </button>
            </form>
          )
        ) : (
          <a
            href={popup.ctaHref || "/urunler"}
            onClick={() => void track(popup.id, "click")}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#7c3aed] text-[14px] font-bold text-white"
          >
            {popup.ctaLabel}
          </a>
        )}
      </div>
    </div>
  );
}
