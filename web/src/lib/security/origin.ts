function normalizeHost(host: string) {
  return host.trim().toLowerCase().split(":")[0] ?? host;
}

function bareHost(host: string) {
  return normalizeHost(host).replace(/^www\./, "");
}

function siteAllowedHosts() {
  const hosts = new Set<string>();
  const siteUrl = process.env.SITE_URL?.trim();
  if (!siteUrl) return hosts;

  try {
    const parsed = new URL(siteUrl);
    const hostname = normalizeHost(parsed.hostname);
    hosts.add(hostname);
    hosts.add(`www.${bareHost(hostname)}`);
    hosts.add(bareHost(hostname));
  } catch {
    /* ignore invalid SITE_URL */
  }

  return hosts;
}

/** Reverse proxy (Nginx) arkasında gerçek site host'unu okur. */
export function requestHost(req: Request) {
  const forwarded = req.headers.get("x-forwarded-host");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return normalizeHost(first);
  }

  const host = req.headers.get("host");
  if (host) return normalizeHost(host);

  try {
    return normalizeHost(new URL(req.url).host);
  } catch {
    return "";
  }
}

/** POST/PATCH/DELETE isteklerinde Origin başlığını doğrular. */
export function isSameOriginRequest(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  try {
    const originHost = normalizeHost(new URL(origin).host);
    const currentHost = requestHost(req);

    if (originHost === currentHost) return true;
    if (bareHost(originHost) === bareHost(currentHost)) return true;

    const allowed = siteAllowedHosts();
    if (allowed.has(originHost)) return true;
    if (allowed.has(bareHost(originHost))) return true;

    return false;
  } catch {
    return false;
  }
}

export function assertSameOrigin(req: Request): void {
  if (!isSameOriginRequest(req)) {
    throw new Error("Geçersiz istek kaynağı");
  }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
