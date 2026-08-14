import { CATEGORIES } from "./home";

export const SITE_CONTACT = {
  phone: "0216 494 26 35",
  phoneTel: "tel:+902164942635",
  whatsapp: "0545 494 26 35",
  whatsappHref: "https://wa.me/905454942635",
  address: "Aydıntepe Mah. Harmandalı Sk. No:24 Tuzla / İSTANBUL",
  email: "info@eserpromo.com",
} as const;

export type CatalogChild = { name: string; slug: string };

export const CATEGORY_CHILDREN: Record<string, CatalogChild[]> = {
  "ajanda-defter": [
    { name: "Ajandalar", slug: "ajandalar" },
    { name: "Defterler", slug: "defterler" },
    { name: "Tarihsiz Defterler", slug: "tarihsiz-defterler" },
    { name: "Organizerler", slug: "organizerler" },
  ],
  kalemler: [
    { name: "Kalem Setleri", slug: "kalem-setleri" },
    { name: "Metal Kalemler", slug: "metal-kalemler" },
    { name: "Plastik Kalemler", slug: "plastik-kalemler" },
  ],
};

export const COLOR_FILTERS = [
  { key: "lacivert", label: "Lacivert", count: 18, hex: "#0b2c5f" },
  { key: "kirmizi", label: "Kırmızı", count: 12, hex: "#e31b23" },
  { key: "siyah", label: "Siyah", count: 16, hex: "#111111" },
  { key: "gri", label: "Gri", count: 8, hex: "#8a8f98" },
  { key: "beyaz", label: "Beyaz", count: 5, hex: "#ffffff" },
  { key: "turkuaz", label: "Turkuaz", count: 6, hex: "#1aa6a6" },
  { key: "kahve", label: "Kahverengi", count: 8, hex: "#6b3f2a" },
] as const;

export const SIZE_FILTERS = [
  { key: "13 x 21 cm", count: 32 },
  { key: "14.8 x 21 cm", count: 16 },
  { key: "16 x 24 cm", count: 24 },
  { key: "17 x 24 cm", count: 10 },
] as const;

export const PAGE_TYPE_FILTERS = [
  { key: "Çizgili", count: 42 },
  { key: "Çizgisiz", count: 18 },
  { key: "Kareli", count: 8 },
] as const;

export const COVER_FILTERS = [
  { key: "Termo Deri", count: 40 },
  { key: "Sert Kapak", count: 16 },
  { key: "Spiralli", count: 12 },
] as const;

export const PRINT_FILTERS = [
  { key: "Lazer Baskı", count: 46 },
  { key: "UV Baskı", count: 36 },
  { key: "Gofre", count: 10 },
] as const;

export type ListingProduct = {
  id: number | string;
  href: string;
  code: string;
  name: string;
  image: string;
  price: number;
  size?: string;
  color?: string;
  stock: number;
  isNew?: boolean;
};

const NOTEBOOK_IMAGES = [
  "https://images.unsplash.com/photo-1531346680769-a1d79b57de5f?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1456327102063-fb5054efe647?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=600&fit=crop",
];

const DEMO_NAMES = [
  "Notix L Çizgili Ajanda",
  "Metro Soft Defter",
  "Urban A5 Spiralli",
  "Classic Termo Deri",
  "Linea Sert Kapak Defter",
  "Office Pro Ajanda",
  "Kraft Eco Defter",
  "Nova Çizgisiz Defter",
  "Agenda Weekly",
  "Slim Pocket Defter",
  "Executive Leather",
  "School Kareli Defter",
  "Boardroom Ajanda",
  "Pastel Soft Cover",
  "Wirebound Meeting",
  "Heritage Termo",
];

const DEMO_COLORS = ["Lacivert", "Kırmızı", "Siyah", "Gri", "Turkuaz", "Kahverengi"] as const;
const DEMO_SIZES = ["13 x 21 cm", "14.8 x 21 cm", "16 x 24 cm", "17 x 24 cm"] as const;
const DEMO_PRICES = [120, 145, 98, 210, 132, 176, 84, 118, 198, 72, 246, 64, 188, 109, 91, 224];

export const CATALOG_PAGE_SIZE = 8;

export function demoNotebooks(): ListingProduct[] {
  return Array.from({ length: 68 }, (_, i) => {
    const code = `DEF-${1001 + i}`;
    return {
      id: `d${i + 1}`,
      code,
      name: DEMO_NAMES[i % DEMO_NAMES.length],
      href: `/product-category/defterler/#${code}`,
      image: NOTEBOOK_IMAGES[i % NOTEBOOK_IMAGES.length],
      price: DEMO_PRICES[i % DEMO_PRICES.length],
      size: DEMO_SIZES[i % DEMO_SIZES.length],
      color: DEMO_COLORS[i % DEMO_COLORS.length],
      stock: [1250, 840, 420, 180, 960, 310, 1500, 75][i % 8],
      isNew: i % 5 === 0,
    };
  });
}

export function isNotebookDemoSlug(slug: string) {
  return (
    slug === "ajanda-defter" ||
    slug === "ajandalar" ||
    slug === "defterler" ||
    slug === "tarihsiz-defterler" ||
    slug === "organizerler" ||
    slug.includes("defter") ||
    slug.includes("ajanda")
  );
}

export function knownCatalogSlug(slug: string) {
  if (CATEGORIES.some((c) => c.slug === slug)) return true;
  return Object.values(CATEGORY_CHILDREN).some((kids) =>
    kids.some((k) => k.slug === slug),
  );
}

export function catalogTitleForSlug(slug: string) {
  for (const cat of CATEGORIES) {
    if (cat.slug === slug) return cat.name;
    const child = CATEGORY_CHILDREN[cat.slug]?.find((c) => c.slug === slug);
    if (child) return child.name;
  }
  return slug.replace(/-\d+$/, "").replace(/-/g, " ");
}

export function catalogBreadcrumb(slug: string) {
  for (const cat of CATEGORIES) {
    if (cat.slug === slug) {
      return [{ name: cat.name, slug: cat.slug }];
    }
    const child = CATEGORY_CHILDREN[cat.slug]?.find((c) => c.slug === slug);
    if (child) {
      return [
        { name: cat.name, slug: cat.slug },
        { name: child.name, slug: child.slug },
      ];
    }
  }
  return [{ name: catalogTitleForSlug(slug), slug }];
}

export function quoteHref(code: string, name: string) {
  const text = `Merhaba, ${code} ${name} ürünü için teklif almak istiyorum.`;
  return `${SITE_CONTACT.whatsappHref}?text=${encodeURIComponent(text)}`;
}

export function asParamList(value: string | string[] | undefined) {
  if (!value) return [] as string[];
  return Array.isArray(value) ? value : [value];
}

export function filterListing(
  products: ListingProduct[],
  opts: { renk?: string[]; ebat?: string[]; sira?: string },
) {
  let list = products;
  if (opts.renk?.length) {
    const labels = opts.renk.map((key) => {
      const found = COLOR_FILTERS.find((c) => c.key === key);
      return (found?.label ?? key).toLocaleLowerCase("tr");
    });
    list = list.filter((p) =>
      labels.includes((p.color ?? "").toLocaleLowerCase("tr")),
    );
  }
  if (opts.ebat?.length) {
    list = list.filter((p) => p.size && opts.ebat!.includes(p.size));
  }
  if (opts.sira === "fiyat-artan") list = [...list].sort((a, b) => a.price - b.price);
  else if (opts.sira === "fiyat-azalan") list = [...list].sort((a, b) => b.price - a.price);
  else if (opts.sira === "yeni") list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
  else if (opts.sira === "ad") {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }
  return list;
}

export { CATEGORIES };
