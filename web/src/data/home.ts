import type { LucideIcon } from "lucide-react";
import {
  Backpack,
  BookOpen,
  Coffee,
  Gift,
  KeyRound,
  Laptop,
  PenLine,
  Shirt,
  Smartphone,
  Trophy,
  HardHat,
  Package,
  Cuboid,
  CupSoda,
} from "lucide-react";

export type CategoryItem = {
  name: string;
  slug: string;
  icon: LucideIcon;
  highlight?: boolean;
  iconClassName?: string;
};

export const CATEGORIES: CategoryItem[] = [
  {
    name: "Hediyelik Setler",
    slug: "hediyelik-setler",
    icon: Gift,
    iconClassName: "text-brand-red",
  },
  { name: "Ajanda & Defter", slug: "ajanda-defter", icon: BookOpen },
  { name: "Kalemler", slug: "kalemler", icon: PenLine },
  { name: "Teknoloji Ürünleri", slug: "teknoloji", icon: Smartphone },
  { name: "Termos & Matara", slug: "termos-matara", icon: CupSoda },
  { name: "Kupa & Bardak", slug: "kupa-bardak", icon: Coffee },
  { name: "Antistres & Oyuncak", slug: "antistres-oyuncak", icon: Cuboid },
  { name: "Masa Üstü Ürünler", slug: "masa-ustu", icon: Laptop },
  { name: "Çanta & Sırt Çantası", slug: "canta", icon: Backpack },
  { name: "Tekstil Ürünleri", slug: "tekstil", icon: Shirt },
  { name: "Anahtarlık", slug: "anahtarlik", icon: KeyRound },
  { name: "Plaket & Ödül", slug: "plaket-odul", icon: Trophy },
  { name: "Şapka & Aksesuar", slug: "sapka-aksesuar", icon: HardHat },
  { name: "Özel Üretim Ürünler", slug: "ozel-uretim", icon: Package },
  {
    name: "KAMPANYALI ÜRÜNLER",
    slug: "kampanyali",
    icon: Gift,
    highlight: true,
    iconClassName: "text-brand-red",
  },
];

export const TEXTILE_PERKS = [
  "Tişört",
  "Polo Yaka",
  "Sweatshirt",
  "Şapka",
  "Yelek",
] as const;

