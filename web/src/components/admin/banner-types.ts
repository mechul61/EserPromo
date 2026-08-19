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

export type BannerKindId = keyof typeof BANNER_KIND_LABEL;
export type BannerPlacementId = keyof typeof BANNER_PLACEMENT_LABEL;

export type BannerKpi = {
  label: string;
  value: string;
  delta?: number;
  color: string;
  icon: "total" | "slider" | "active" | "passive" | "views";
};

export type BannerRow = {
  id: string;
  kind: BannerKindId;
  title: string;
  href: string;
  image: string;
  imagePath: string;
  width: number;
  height: number;
  placement: BannerPlacementId;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  minAmount: number;
  maxAmount: number;
  views: number;
  sortOrder: number;
};

export type BannerShare = {
  id: BannerPlacementId;
  name: string;
  count: number;
  percent: number;
  color: string;
};

export function bannerAmountLabel(minAmount: number, maxAmount: number) {
  if (minAmount <= 0 && maxAmount <= 0) return "Sınırsız";
  const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (minAmount > 0 && maxAmount > 0) return `${fmt(minAmount)} – ${fmt(maxAmount)} TL`;
  if (minAmount > 0) return `${fmt(minAmount)} TL+`;
  return `≤ ${fmt(maxAmount)} TL`;
}

