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

export const QUICK_CATEGORIES = [
  {
    name: "Hediyelik Setler",
    slug: "hediyelik-setler",
    image:
      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400&h=300&fit=crop",
  },
  {
    name: "Teknoloji Ürünleri",
    slug: "teknoloji",
    image:
      "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop",
  },
  {
    name: "Ajanda & Defter",
    slug: "ajanda-defter",
    image:
      "https://images.unsplash.com/photo-1531346680769-a1d79b57de5f?w=400&h=300&fit=crop",
  },
  {
    name: "Kalemler",
    slug: "kalemler",
    image:
      "https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&h=300&fit=crop",
  },
  {
    name: "Termos & Matara",
    slug: "termos-matara",
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop",
  },
  {
    name: "Çanta & Sırt Çantası",
    slug: "canta",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop",
  },
  {
    name: "Masa Üstü Ürünler",
    slug: "masa-ustu",
    image:
      "https://images.unsplash.com/photo-1497215728101-536b6f15019c?w=400&h=300&fit=crop",
  },
  {
    name: "Plaket & Ödül",
    slug: "plaket-odul",
    image:
      "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=300&fit=crop",
  },
] as const;

export const DEMO_PRODUCTS = [
  {
    id: 1,
    code: "ES-1001",
    name: "Premium Hediye Seti",
    price: "549,90",
    badge: "Çok Satan" as const,
    image:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&h=500&fit=crop",
  },
  {
    id: 2,
    code: "ES-2044",
    name: "Metal Roller Kalem",
    price: "89,90",
    badge: "Yeni" as const,
    image:
      "https://images.unsplash.com/photo-1583485088034-697b75744bac?w=500&h=500&fit=crop",
  },
  {
    id: 3,
    code: "ES-3310",
    name: "500ml Çelik Termos",
    price: "249,90",
    badge: "Kampanyalı" as const,
    image:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop",
  },
  {
    id: 4,
    code: "ES-1188",
    name: "Laptop Sırt Çantası",
    price: "399,90",
    badge: "Çok Satan" as const,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
  },
  {
    id: 5,
    code: "ES-5521",
    name: "10.000mAh Powerbank",
    price: "329,90",
    badge: "Yeni" as const,
    image:
      "https://images.unsplash.com/photo-1609091839311-b65b4f4f0c2a?w=500&h=500&fit=crop",
  },
  {
    id: 6,
    code: "ES-7702",
    name: "Polo Yaka Tişört",
    price: "279,90",
    badge: "Kampanyalı" as const,
    image:
      "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500&h=500&fit=crop",
  },
];
