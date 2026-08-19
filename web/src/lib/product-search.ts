export function normalizeSearchQuery(raw: string) {
  return raw.trim().slice(0, 80);
}
