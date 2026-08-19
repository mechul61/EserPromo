import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  email: z.string().trim().email().max(160),
  popupId: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçerli bir e-posta girin");

  const email = body.data.email.toLowerCase();
  await prisma.popupSubscriber.upsert({
    where: { email },
    create: { email, popupId: body.data.popupId ?? null },
    update: { popupId: body.data.popupId ?? undefined },
  });

  if (body.data.popupId) {
    await prisma.popup.updateMany({
      where: { id: body.data.popupId, isDraft: false },
      data: { conversions: { increment: 1 } },
    });
  }

  return Response.json({ ok: true });
}
