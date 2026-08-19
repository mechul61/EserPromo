"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const GUEST_KEY = "ep_favorites";

type FavoritesContextValue = {
  ready: boolean;
  authenticated: boolean;
  ids: Set<number>;
  count: number;
  isFavorited: (productId: number) => boolean;
  toggle: (productId: number) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readGuestIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
}

function writeGuestIds(ids: number[]) {
  window.localStorage.setItem(GUEST_KEY, JSON.stringify([...new Set(ids)]));
}

function clearGuestIds() {
  window.localStorage.removeItem(GUEST_KEY);
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [ids, setIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const guest = readGuestIds();
      try {
        const res = await fetch("/api/favorites/", { cache: "no-store" });
        const data = (await res.json()) as {
          authenticated?: boolean;
          productIds?: number[];
        };
        if (cancelled) return;

        const loggedIn = Boolean(data.authenticated);
        setAuthenticated(loggedIn);

        if (loggedIn) {
          let next = new Set(data.productIds ?? []);
          if (guest.length) {
            const sync = await fetch("/api/favorites/", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productIds: guest }),
            });
            const synced = (await sync.json()) as { productIds?: number[] };
            if (sync.ok && Array.isArray(synced.productIds)) {
              next = new Set(synced.productIds);
            } else {
              guest.forEach((id) => next.add(id));
            }
            clearGuestIds();
            router.refresh();
          }
          setIds(next);
        } else {
          setIds(new Set(guest));
        }
      } catch {
        if (!cancelled) {
          setAuthenticated(false);
          setIds(new Set(guest));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const toggle = useCallback(
    async (productId: number) => {
      if (!ready) return;
      const previous = ids;
      const next = new Set(ids);
      const favorited = !next.has(productId);
      if (favorited) next.add(productId);
      else next.delete(productId);
      setIds(next);

      if (!authenticated) {
        writeGuestIds([...next]);
        return;
      }

      try {
        const res = await fetch("/api/favorites/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const data = (await res.json()) as {
          favorited?: boolean;
          productIds?: number[];
          error?: string;
        };

        if (res.status === 401) {
          setAuthenticated(false);
          writeGuestIds([...next]);
          return;
        }

        if (!res.ok) {
          setIds(previous);
          return;
        }

        setAuthenticated(true);
        if (Array.isArray(data.productIds)) {
          setIds(new Set(data.productIds));
        }
        router.refresh();
      } catch {
        setIds(previous);
      }
    },
    [authenticated, ids, ready, router],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      ready,
      authenticated,
      ids,
      count: ids.size,
      isFavorited: (productId: number) => ids.has(productId),
      toggle,
    }),
    [authenticated, ids, ready, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
