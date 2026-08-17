import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  firstName: z.string().trim().min(2).max(40).optional(),
  lastName: z.string().trim().max(40).optional(),
  phone: z.string().trim().max(32).optional(),
  birthDate: z.string().nullable().optional(),
  gender: z.string().trim().max(20).nullable().optional(),
  companyName: z.string().trim().max(120).optional(),
  companyTitle: z.string().trim().max(80).optional(),
  taxOffice: z.string().trim().max(80).optional(),
  taxNumber: z.string().trim().max(11).optional(),
  tcKimlik: z.string().trim().max(11).optional(),
  useCorporateDefault: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
  notifySms: z.boolean().optional(),
  notifyOrder: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Bilgileri kontrol edin.");

  const data = body.data;
  const name =
    data.firstName !== undefined
      ? [data.firstName, data.lastName ?? ""].filter(Boolean).join(" ").trim()
      : undefined;

  const birthDate =
    data.birthDate === undefined
      ? undefined
      : data.birthDate
        ? new Date(data.birthDate)
        : null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      },
    }),
    prisma.userProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        birthDate: birthDate ?? undefined,
        gender: data.gender ?? undefined,
        companyName: data.companyName ?? "",
        companyTitle: data.companyTitle ?? "",
        taxOffice: data.taxOffice ?? "",
        taxNumber: data.taxNumber ?? "",
        tcKimlik: data.tcKimlik ?? "",
        useCorporateDefault: data.useCorporateDefault ?? false,
        notifyEmail: data.notifyEmail ?? true,
        notifySms: data.notifySms ?? false,
        notifyOrder: data.notifyOrder ?? true,
      },
      update: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(birthDate !== undefined ? { birthDate } : {}),
        ...(data.gender !== undefined ? { gender: data.gender } : {}),
        ...(data.companyName !== undefined ? { companyName: data.companyName } : {}),
        ...(data.companyTitle !== undefined ? { companyTitle: data.companyTitle } : {}),
        ...(data.taxOffice !== undefined ? { taxOffice: data.taxOffice } : {}),
        ...(data.taxNumber !== undefined ? { taxNumber: data.taxNumber } : {}),
        ...(data.tcKimlik !== undefined ? { tcKimlik: data.tcKimlik } : {}),
        ...(data.useCorporateDefault !== undefined ? { useCorporateDefault: data.useCorporateDefault } : {}),
        ...(data.notifyEmail !== undefined ? { notifyEmail: data.notifyEmail } : {}),
        ...(data.notifySms !== undefined ? { notifySms: data.notifySms } : {}),
        ...(data.notifyOrder !== undefined ? { notifyOrder: data.notifyOrder } : {}),
      },
    }),
  ]);

  return Response.json({ ok: true });
}
