export function grossPrice(net: number, vatRate: number) {
  if (!Number.isFinite(net)) return 0;
  const vat = Number.isFinite(vatRate) ? vatRate : 20;
  return net * (1 + vat / 100);
}

export function colorToHex(name: string | null | undefined): string {
  const key = (name ?? "").toLocaleLowerCase("tr").replace(/\s+/g, "");
  const map: Record<string, string> = {
    beyaz: "#ffffff",
    siyah: "#111111",
    lacivert: "#0b2c5f",
    navy: "#0b2c5f",
    mavi: "#2563eb",
    koyumavi: "#1e3a8a",
    kirmizi: "#e31b23",
    kırmızı: "#e31b23",
    turuncu: "#f97316",
    sari: "#eab308",
    sarı: "#eab308",
    yesil: "#16a34a",
    yeşil: "#16a34a",
    gri: "#8a8f98",
    gümüş: "#c0c4cc",
    gumus: "#c0c4cc",
    kahverengi: "#6b3f2a",
    pembe: "#ec4899",
    mor: "#7c3aed",
    turkuaz: "#14b8a6",
  };
  return map[key] ?? "#d1d5db";
}

export type PriceTier = {
  min: number;
  max: number;
  unit: number;
};

export function bulkTiers(baseGross: number): PriceTier[] {
  const rows = [
    { min: 1, max: 500, factor: 12 / 8.1 },
    { min: 501, max: 1000, factor: 11 / 8.1 },
    { min: 1001, max: 2000, factor: 10 / 8.1 },
    { min: 2001, max: 3000, factor: 9.2 / 8.1 },
    { min: 3001, max: 4000, factor: 8.6 / 8.1 },
    { min: 4001, max: 5000, factor: 1 },
  ];
  return rows.map((row) => ({
    min: row.min,
    max: row.max,
    unit: Math.round(baseGross * row.factor * 100) / 100,
  }));
}

export function unitForQty(tiers: PriceTier[], qty: number) {
  const hit = [...tiers].reverse().find((t) => qty >= t.min) ?? tiers[0];
  return hit?.unit ?? 0;
}

export function stripHtml(value: string | null | undefined) {
  return (value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
