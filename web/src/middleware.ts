import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isSameOriginRequest } from "@/lib/security/origin";

const SESSION_COOKIE = "ep_sid";
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const FORBIDDEN_METHODS = new Set(["TRACE", "TRACK", "CONNECT"]);
const RATE_WINDOW_MS = 60_000;
const RATE_LIMITS = {
  auth: { max: 20, windowMs: RATE_WINDOW_MS },
  support: { max: 30, windowMs: RATE_WINDOW_MS },
  adminApi: { max: 120, windowMs: RATE_WINDOW_MS },
} as const;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function isAuthEndpoint(pathname: string) {
  return pathname.startsWith("/api/auth/");
}

function isSupportEndpoint(pathname: string) {
  return (
    pathname === "/api/support" ||
    pathname.startsWith("/api/support/") ||
    pathname === "/api/account/support" ||
    pathname.startsWith("/api/account/support/")
  );
}

function applyRateLimit(req: NextRequest, key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (ipHits.size > 5000) {
    for (const [bucketKey, bucket] of ipHits.entries()) {
      if (bucket.resetAt <= now) ipHits.delete(bucketKey);
    }
  }
  const bucket = ipHits.get(key);
  if (!bucket || bucket.resetAt <= now) {
    ipHits.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  if (bucket.count >= max) {
    return NextResponse.json(
      { error: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." },
      { status: 429 },
    );
  }
  bucket.count += 1;
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  if (FORBIDDEN_METHODS.has(method)) {
    return new NextResponse(null, { status: 405 });
  }

  if (WRITE_METHODS.has(method) && pathname.startsWith("/api/") && !isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Geçersiz origin." }, { status: 403 });
  }

  if (WRITE_METHODS.has(method) && isAuthEndpoint(pathname)) {
    const limited = applyRateLimit(req, `auth:${clientIp(req)}`, RATE_LIMITS.auth.max, RATE_LIMITS.auth.windowMs);
    if (limited) return limited;
  }

  if (WRITE_METHODS.has(method) && isSupportEndpoint(pathname)) {
    const limited = applyRateLimit(
      req,
      `support:${clientIp(req)}`,
      RATE_LIMITS.support.max,
      RATE_LIMITS.support.windowMs,
    );
    if (limited) return limited;
  }

  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Giriş yapın." }, { status: 401 });
    }
    const login = req.nextUrl.clone();
    login.pathname = "/giris";
    login.search = "";
    return NextResponse.redirect(login);
  }

  if (WRITE_METHODS.has(method) && isAdminApi) {
    const limited = applyRateLimit(
      req,
      `admin:${clientIp(req)}`,
      RATE_LIMITS.adminApi.max,
      RATE_LIMITS.adminApi.windowMs,
    );
    if (limited) return limited;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
