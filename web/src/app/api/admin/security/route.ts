import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { isRecaptchaEnabled, isRecaptchaConfigured, setRecaptchaEnabled } from "@/lib/security/recaptcha";

const schema = z.object({
  recaptchaEnabled: z.boolean(),
});

export async function GET() {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  return Response.json({
    recaptchaEnabled: await isRecaptchaEnabled(),
    recaptchaConfigured: isRecaptchaConfigured(),
  });
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
  if (!body.success) return jsonError("Geçersiz istek");

  await setRecaptchaEnabled(body.data.recaptchaEnabled);
  revalidatePath("/");
  revalidatePath("/giris");
  revalidatePath("/kayit");
  revalidatePath("/sifremi-unuttum");
  revalidatePath("/iletisim");
  revalidatePath("/admin/guvenlik");
  return Response.json({ ok: true, recaptchaEnabled: body.data.recaptchaEnabled });
}
