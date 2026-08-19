export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  if (!origin) return;
  try {
    const requestHost = new URL(req.url).host;
    const originHost = new URL(origin).host;
    if (requestHost !== originHost) {
      throw new Error("Geçersiz istek kaynağı");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Geçersiz istek kaynağı") {
      throw error;
    }
    throw new Error("Geçersiz istek kaynağı");
  }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
