import { prisma } from "../db";
import { mediaUrl } from "../media";
import { cartMoneySummary, getCart } from "./cart";

export const BANNER_KIND_LABEL = {
  banner: "Banner",
  slider: "Slider",
} as const;

export const BANNER_PLACEMENT_LABEL = {
  hero: "Ana Sayfa Hero",
  middle_1: "Orta Banner 1",
  middle_2: "Orta Banner 2",
  bottom: "Alt Banner",
  side: "Yan Banner",
  category: "Kategori Banner",
} as const;

export type BannerPlacementId = keyof typeof BANNER_PLACEMENT_LABEL;
export type BannerKindId = keyof typeof BANNER_KIND_LABEL;

export function bannerImageUrl(imagePath: string | null | undefined) {
  if (!imagePath) return "/brand/logo.png";
  if (imagePath.startsWith("/")) return imagePath;
  return mediaUrl(imagePath) ?? "/brand/logo.png";
}

export function bannerInWindow(banner: { isActive: boolean; startsAt: Date | null; endsAt: Date | null }, now = new Date()) {
  if (!banner.isActive) return false;
  if (banner.startsAt && now < banner.startsAt) return false;
  if (banner.endsAt && now > banner.endsAt) return false;
  return true;
}

export function bannerMatchesAmount(
  banner: { minAmount: { toString(): string } | number; maxAmount: { toString(): string } | number },
  cartGrand: number,
) {
  const min = Number(banner.minAmount);
  const max = Number(banner.maxAmount);
  if (min > 0 && cartGrand < min) return false;
  if (max > 0 && cartGrand > max) return false;
  return true;
}

export async function getHeroSlides() {
  const now = new Date();
  const [rows, cart] = await Promise.all([
    prisma.banner.findMany({
      where: {
        kind: "slider",
        placement: "hero",
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getCart(),
  ]);
  const cartGrand = cart ? cartMoneySummary(cart.items).grand : 0;
  const visible = rows.filter((row) => bannerMatchesAmount(row, cartGrand));
  if (visible.length) {
    void prisma.banner.updateMany({
      where: { id: { in: visible.map((row) => row.id) } },
      data: { views: { increment: 1 } },
    });
    return visible.map((row) => ({
      src: bannerImageUrl(row.imagePath),
      alt: row.title,
      href: row.href || "/urunler",
    }));
  }
  return [
    {
      src: "/brand/hero-slide-1.jpg",
      alt: "Markanız Her Yerde Sizinle Olsun!",
      href: "/urunler",
    },
  ];
}
