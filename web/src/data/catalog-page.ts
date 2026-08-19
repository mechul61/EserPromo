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
  skuGroup: string;
  isGroupPrimary: boolean;
};

export type FilterOption = { key: string; label: string; count: number; hex?: string };

export const CATALOG_PAGE_SIZE = 8;

export function filterKey(value: string) {
  return value.trim().toLocaleLowerCase("tr").replace(/\s+/g, "-");
}

export function listingFilterOptions(products: ListingProduct[]): {
  colors: FilterOption[];
  sizes: FilterOption[];
} {
  const colors = new Map<string, FilterOption>();
  const sizes = new Map<string, FilterOption>();
  for (const product of products) {
    if (product.color) {
      const key = filterKey(product.color);
      const current = colors.get(key);
      colors.set(key, {
        key,
        label: product.color,
        count: (current?.count ?? 0) + 1,
      });
    }
    if (product.size) {
      const key = product.size;
      const current = sizes.get(key);
      sizes.set(key, { key, label: key, count: (current?.count ?? 0) + 1 });
    }
  }
  return {
    colors: [...colors.values()].sort((a, b) => a.label.localeCompare(b.label, "tr")),
    sizes: [...sizes.values()].sort((a, b) => a.label.localeCompare(b.label, "tr")),
  };
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
    list = list.filter((p) => p.color && opts.renk!.includes(filterKey(p.color)));
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
  return [...list].sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));
}

export { CATEGORIES };
