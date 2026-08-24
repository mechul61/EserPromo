"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "ep_vid";

function visitorId() {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return `anon-${Date.now()}`;
  }
}

export function PageViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next")
    ) {
      return;
    }

    const vid = visitorId();
    void fetch("/api/analytics/pageview/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vid }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => null);
  }, [pathname]);

  return null;
}
