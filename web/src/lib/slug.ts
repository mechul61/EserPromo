/** Türkçe karakterleri slug'a çevirir. WP permalink ile aynı kural. */

const map: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function slugify(input: string): string {
  const mapped = input
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("");
  return mapped
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120);
}

/**
 * WP: /urun/adalar-ysl-yesil-tarihsiz-defter-17128/
 * Kaynak: ürün başlığı + urun_id
 */
export function productSlug(title: string, id: number): string {
  const base = slugify(title) || "urun";
  if (base.endsWith(`-${id}`)) return base;
  return `${base}-${id}`;
}

/** İç grup anahtarı (URL değil). */
export function productGroupSlug(name: string, skuGroup: string): string {
  const base = slugify(name) || "urun";
  const group = slugify(skuGroup) || skuGroup.toLowerCase();
  return `${base}-${group}`.slice(0, 120);
}

/**
 * WP: /product-category/ajanda-ve-defterler-107/
 */
export function categorySlug(name: string, id: number): string {
  const base = slugify(name) || "kategori";
  if (base.endsWith(`-${id}`)) return base;
  return `${base}-${id}`;
}
