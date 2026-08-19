import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const patchSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: {
      cookieAnalytics: true,
      cookieMarketing: true,
      cookieConsentAt: true,
    },
  });

  return Response.json({
    analytics: profile?.cookieAnalytics ?? false,
    marketing: profile?.cookieMarketing ?? false,
    consentAt: profile?.cookieConsentAt?.toISOString() ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Tercihleri kontrol edin.");

  const now = new Date();
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      cookieAnalytics: body.data.analytics,
      cookieMarketing: body.data.marketing,
      cookieConsentAt: now,
    },
    update: {
      cookieAnalytics: body.data.analytics,
      cookieMarketing: body.data.marketing,
      cookieConsentAt: now,
    },
  });

  return Response.json({ ok: true });
}
