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

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Adres bilgilerini kontrol edin.");
  if (!isValidTRPhone(body.data.phone)) return jsonError("Geçerli bir telefon girin.");

  const count = await prisma.address.count({ where: { userId: user.id } });
  const isDefault = body.data.isDefault || count === 0;

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({
    data: {
      userId: user.id,
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
