"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

const variants = {
  overlay:
    "absolute top-2.5 right-2.5 z-20 flex size-8 items-center justify-center rounded-full text-[#9aa0a8] hover:text-brand-red",
  home: "absolute top-2.5 right-2.5 z-20 flex size-8 items-center justify-center rounded-full bg-white/95 text-[#b0b0b0] shadow-sm transition hover:text-brand-red",
  plain: "mt-0.5 shrink-0 text-navy hover:text-brand-red",
} as const;

export function FavoriteButton({
  productId,
  variant = "overlay",
  className = "",
  iconClassName = "size-[18px]",
}: {
  productId: number;
  variant?: keyof typeof variants;
  className?: string;
  iconClassName?: string;
}) {
  const { isFavorited, toggle, ready } = useFavorites();
  if (!Number.isInteger(productId) || productId <= 0) return null;

  const active = isFavorited(productId);

  return (
    <button
      type="button"
      disabled={!ready}
      aria-label={active ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={active}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle(productId);
      }}
      className={`${variants[variant]} ${active ? "text-brand-red" : ""} ${className}`}
    >
      <Heart
        className={iconClassName}
        strokeWidth={1.6}
        fill={active ? "currentColor" : "none"}
      />
    </button>
  );
}
