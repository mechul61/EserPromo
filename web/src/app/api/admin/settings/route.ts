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
  const settings = await saveSiteSettings(body);
  revalidatePath("/", "layout");
  revalidatePath("/admin/ayarlar");
  revalidatePath("/iletisim");
  revalidatePath("/robots.txt");
  return Response.json({ ok: true, settings });
}
