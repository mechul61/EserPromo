type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Bellek içi sınır — tek süreç. Üretimde Redis'e taşınır. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function clientKey(req: Request, extra = ""): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || "local";
  return `${ip}:${extra}`;
}
