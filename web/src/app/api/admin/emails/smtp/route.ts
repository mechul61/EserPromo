import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { getSmtpConfig, maskSecret, setSmtpConfig, smtpConfigReady } from "@/lib/mail";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  host: z.string().trim().max(120).optional().or(z.literal("")),
  port: z.number().int().min(1).max(65535).optional(),
  user: z.string().trim().max(120).optional().or(z.literal("")),
  pass: z.string().trim().max(200).optional().or(z.literal("")),
  from: z.string().trim().email().max(120).optional().or(z.literal("")),
});

export async function GET() {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  const config = await getSmtpConfig();
  return Response.json({
    host: config.host,
    port: config.port,
    user: config.user,
    pass: maskSecret(config.pass),
    from: config.from,
    passSet: Boolean(config.pass),
    ready: smtpConfigReady(config),
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
  if (!body.success) return jsonError("SMTP bilgilerini kontrol edin");

  const saved = await setSmtpConfig({
    host: body.data.host,
    port: body.data.port,
    user: body.data.user,
    pass: body.data.pass,
    from: body.data.from,
  });
  revalidatePath("/admin/eposta");
  return Response.json({
    ok: true,
    ready: smtpConfigReady({
      host: saved.smtpHost,
      port: Number(saved.smtpPort),
      user: saved.smtpUser,
      pass: saved.smtpPass,
      from: saved.smtpFrom,
    }),
  });
}
