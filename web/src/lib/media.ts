/** Yerel storage yolu → tarayıcı URL'i (hotlink yok). */
export function mediaUrl(localPath: string | null | undefined): string | null {
  if (!localPath) return null;
  const clean = localPath.replace(/^[/\\]+/, "").replace(/\\/g, "/");
  return `/api/media/${clean}`;
}

export function formatPriceTry(value: { toString(): string } | number | string): string {
  const n = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatStock(value: number) {
  const n = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  return `${n.toLocaleString("tr-TR")} Adet`;
}
