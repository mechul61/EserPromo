import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "ep_sid";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
