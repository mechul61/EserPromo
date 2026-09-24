import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

export async function GET() {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  return Response.json({ ok: true, settings: await getSiteSettings() });
}

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Ayar verisi okunamadı. Sayfayı yenileyip tekrar kaydedin.");
  }
  try {
    const settings = await saveSiteSettings(body);
    for (const path of ["/", "/admin/ayarlar/", "/iletisim/", "/robots.txt"]) {
      try {
        revalidatePath(path, path === "/" ? "layout" : "page");
      } catch (error) {
        console.error("settings revalidate", path, error);
      }
    }
    return Response.json({ ok: true, settings });
  } catch (error) {
    console.error("save site settings", error);
    return jsonError("Site ayarları kaydedilemedi. Lütfen tekrar deneyin.", 500);
  }
}
