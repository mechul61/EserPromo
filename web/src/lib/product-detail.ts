export function grossPrice(net: number, vatRate: number) {
  if (!Number.isFinite(net)) return 0;
  const vat = Number.isFinite(vatRate) ? vatRate : 20;
  return net * (1 + vat / 100);
}

function foldColorName(name: string) {
  return name
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

const COLOR_RULES: Array<[string, string]> = [
  ["lacivert", "#0b2c5f"],
  ["turkuazmavi", "#0ea5a4"],
  ["turkuazyesil", "#0f766e"],
  ["fistik", "#84cc16"],
  ["acikyesil", "#4ade80"],
  ["koyuturuncu", "#c2410c"],
  ["koyumavi", "#1e3a8a"],
  ["kahverengi", "#6b3f2a"],
  ["hardal", "#ca8a04"],
  ["turkuaz", "#14b8a6"],
  ["taba", "#c4a574"],
  ["bej", "#d4c4a8"],
  ["krem", "#f5e6c8"],
  ["ekru", "#f3ead8"],
  ["fume", "#6b7280"],
  ["kahve", "#6b3f2a"],
  ["bordo", "#7f1d1d"],
  ["kirmizi", "#e31b23"],
  ["turuncu", "#f97316"],
  ["pembe", "#ec4899"],
  ["lila", "#c084fc"],
  ["mor", "#7c3aed"],
  ["sari", "#eab308"],
  ["altin", "#d4a017"],
  ["haki", "#4d7c0f"],
  ["yesil", "#16a34a"],
  ["mavi", "#2563eb"],
  ["siyah", "#111111"],
  ["beyaz", "#ffffff"],
  ["gumus", "#c0c4cc"],
  ["gri", "#8a8f98"],
  ["navy", "#0b2c5f"],
];

export function colorToHex(name: string | null | undefined): string {
  const key = foldColorName(name ?? "");
  if (!key) return "#d1d5db";
  for (const [needle, hex] of COLOR_RULES) {
    if (key.includes(needle)) return hex;
  }
  return "#d1d5db";
}

export type PriceTier = {
  min: number;
  max: number;
  unit: number;
};

export type PrintKind = "UV Baskı" | "Tampon Baskı";

const UV_FACTORS = [
  { min: 1, max: 500, factor: 12 / 8.1 },
  { min: 501, max: 1000, factor: 11 / 8.1 },
  { min: 1001, max: 2000, factor: 10 / 8.1 },
  { min: 2001, max: 3000, factor: 9.2 / 8.1 },
  { min: 3001, max: 4000, factor: 8.6 / 8.1 },
  { min: 4001, max: 5000, factor: 1 },
] as const;

/** Tampon, UV’ye göre daha düşük baskı farkı. */
const TAMPON_PREMIUM = 0.72;

export function bulkTiers(
  baseGross: number,
  printType: PrintKind | null = null,
): PriceTier[] {
  return UV_FACTORS.map((row) => {
    let factor = 1;
    if (printType === "UV Baskı") factor = row.factor;
    if (printType === "Tampon Baskı") factor = 1 + (row.factor - 1) * TAMPON_PREMIUM;
    return {
      min: row.min,
      max: row.max,
      unit: Math.round(baseGross * factor * 100) / 100,
    };
  });
}

export function unitForQty(tiers: PriceTier[], qty: number) {
  const hit = [...tiers].reverse().find((t) => qty >= t.min) ?? tiers[0];
  return hit?.unit ?? 0;
}

export function stripHtml(value: string | null | undefined) {
  return htmlToPlain(value).replace(/\s+/g, " ").trim();
}

export function htmlToPlain(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

export function parseProductCopy(
  description: string | null | undefined,
  featuresRaw: string | null | undefined,
) {
  const fromDesc = splitSpecText(htmlToPlain(description));
  const fromFeat = splitSpecText(htmlToPlain(featuresRaw));
  const seen = new Set<string>();
  const features: string[] = [];
  for (const item of [...fromFeat.features, ...fromDesc.features]) {
    const key = item.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    features.push(item);
  }
  const printNotes = features.filter((item) => /bask[ıi]\s*:/i.test(item) || /^bask[ıi]\b/i.test(item));
  return {
    prose: fromDesc.prose || fromFeat.prose,
    features,
    printNotes,
  };
}

function splitSpecText(text: string): { prose: string; features: string[] } {
  if (!text) return { prose: "", features: [] };

  const starParts = text
    .split(/\s*\*\s+/)
    .map((part) => part.replace(/^\*+\s*/, "").trim())
    .filter(Boolean);

  if (/\*/.test(text) && starParts.length >= 2) {
    const startsWithStar = /^\s*\*/.test(text);
    if (!startsWithStar && starParts[0] && !/:\s*\S/.test(starParts[0])) {
      return { prose: starParts[0], features: starParts.slice(1) };
    }
    return { prose: "", features: starParts };
  }

  const lines = text
    .split(/\n+|•|;/)
    .map((line) => line.replace(/^\*+\s*/, "").trim())
    .filter((line) => line.length > 1);

  const labeled = lines.filter((line) => /^.{2,48}:\s+\S/.test(line));
  if (labeled.length >= 2) {
    return {
      prose: lines.filter((line) => !/^.{2,48}:\s+\S/.test(line)).join(" ").trim(),
      features: labeled,
    };
  }

  return { prose: text, features: [] };
}
