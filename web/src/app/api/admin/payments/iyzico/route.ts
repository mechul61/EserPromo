import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { getIyzicoConfig, iyzicoConfigReady, setIyzicoConfig, type IyzicoMode } from "@/lib/commerce/payments";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  uri: z.string().trim().url().max(200),
  apiKey: z.string().trim().max(120).optional().or(z.literal("")),
  secretKey: z.string().trim().max(120).optional().or(z.literal("")),
});

function modeFromParam(uri: string | null): IyzicoMode | undefined {
  if (!uri) return undefined;
  return uri.includes("sandbox") ? "sandbox" : "live";
}

export async function GET(req: NextRequest) {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  const requestedUri = req.nextUrl.searchParams.get("uri");
  const config = await getIyzicoConfig(modeFromParam(requestedUri));
  return Response.json({
    uri: requestedUri || config.uri || "https://sandbox-api.iyzipay.com",
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    apiKeySet: Boolean(config.apiKey),
    secretSet: Boolean(config.secretKey),
    ready: iyzicoConfigReady(config),
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
  if (!body.success) return jsonError("Iyzico bilgilerini kontrol edin");

  const saved = await setIyzicoConfig({
    uri: body.data.uri,
    apiKey: body.data.apiKey,
    secretKey: body.data.secretKey,
  });
  revalidatePath("/admin/odemeler");
  revalidatePath("/odeme");
  return Response.json({
    ok: true,
    ready: iyzicoConfigReady({ uri: saved.iyzicoUri, apiKey: saved.iyzicoApiKey, secretKey: saved.iyzicoSecretKey }),
  });
}
