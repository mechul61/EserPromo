"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

export function FavoriteHeaderLink() {
  const { count } = useFavorites();

  return (
    <Link href="/favoriler" className="relative flex flex-col items-center gap-0.5 text-[11px]">
      <Heart className="size-5 text-navy" />
      <span className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
        {Math.min(count, 99)}
      </span>
      <span className="font-medium text-navy">Favorilerim</span>
    </Link>
  );
}
