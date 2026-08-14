import { siteUrl } from "../env";

export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return;
  const allowed = new Set([
    siteUrl(),
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  if (!allowed.has(origin.replace(/\/$/, ""))) {
    throw new Error("Geçersiz istek kaynağı");
  }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
