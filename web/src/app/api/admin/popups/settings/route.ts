import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { getPopupSettings, setPopupSettings } from "@/lib/commerce/popups";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  enabled: z.boolean(),
  defaultDelay: z.number().int().min(0).max(120),
  defaultFrequency: z.number().int().min(0).max(8760),
});

export async function GET() {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  return Response.json(await getPopupSettings());
}

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz ayar");

  await setPopupSettings(body.data);
  revalidatePath("/admin/popuplar");
  revalidatePath("/");
  return Response.json({ ok: true, ...body.data });
}
