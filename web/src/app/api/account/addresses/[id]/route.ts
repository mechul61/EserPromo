import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isValidTRPhone, phoneDigits } from "@/lib/phone";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  title: z.string().trim().min(2).max(40),
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().min(10).max(32),
  country: z.string().trim().min(2).max(40).default("Türkiye"),
  city: z.string().trim().min(2).max(40),
  district: z.string().trim().min(2).max(40),
  postalCode: z.string().trim().max(10).optional().or(z.literal("")),
  line: z.string().trim().min(6).max(200),
  isDefault: z.boolean().optional(),
});

async function ownedAddress(userId: string, id: string) {
  return prisma.address.findFirst({ where: { id, userId } });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const { id } = await context.params;
  const existing = await ownedAddress(user.id, id);
  if (!existing) return jsonError("Adres bulunamadı.", 404);

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Adres bilgilerini kontrol edin.");
  if (!isValidTRPhone(body.data.phone)) return jsonError("Geçerli bir telefon girin.");

  const isDefault = body.data.isDefault ?? existing.isDefault;
  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.update({
    where: { id },
    data: {
      title: body.data.title,
      fullName: body.data.fullName,
      email: body.data.email ?? "",
      phone: phoneDigits(body.data.phone),
      country: body.data.country,
      city: body.data.city,
      district: body.data.district,
      postalCode: body.data.postalCode ?? "",
      line: body.data.line,
      isDefault,
    },
  });

  return Response.json({ ok: true, address });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const { id } = await context.params;
  const existing = await ownedAddress(user.id, id);
  if (!existing) return jsonError("Adres bulunamadı.", 404);

  await prisma.address.delete({ where: { id } });

  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  return Response.json({ ok: true });
}
