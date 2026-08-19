import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { customerWriteSchema, parseCustomerGroup, parseCustomerSource } from "@/lib/admin/customer-input";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/security/crypto";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { isValidTRPhone, phoneDigits } from "@/lib/phone";
import { splitName } from "@/lib/account";
import { isStaffRole } from "@/lib/admin/staff-copy";

const patchSchema = customerWriteSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const body = patchSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) return jsonError("Kullanıcı bulunamadı", 404);

  if (id === admin.id && (body.data.isActive === false || body.data.blocked === true)) {
    return jsonError("Kendi hesabınızı pasifleştiremezsiniz.");
  }

  if (body.data.email) {
    const email = normalizeEmail(body.data.email);
    const taken = await prisma.user.findFirst({ where: { email, NOT: { id } }, select: { id: true } });
    if (taken) return jsonError("Bu e-posta zaten kayıtlı");
  }

  const phoneRaw = body.data.phone?.trim();
  if (phoneRaw && !isValidTRPhone(phoneRaw)) return jsonError("Telefon numarasını kontrol edin");

  let passwordHash: string | undefined;
  if (body.data.password) {
    const policy = passwordPolicyError(body.data.password);
    if (policy) return jsonError(policy);
    passwordHash = await hashPassword(body.data.password);
  }

  const names = body.data.name ? splitName(body.data.name) : null;

  await prisma.user.update({
    where: { id },
    data: {
      ...(body.data.name ? { name: body.data.name.trim() } : {}),
      ...(body.data.email ? { email: normalizeEmail(body.data.email) } : {}),
      ...(phoneRaw !== undefined ? { phone: phoneRaw ? phoneDigits(phoneRaw) : null } : {}),
      ...(body.data.city !== undefined ? { city: body.data.city.trim() } : {}),
      ...(body.data.customerGroup ? { customerGroup: parseCustomerGroup(body.data.customerGroup) } : {}),
      ...(body.data.source ? { source: parseCustomerSource(body.data.source) } : {}),
      ...(body.data.isActive !== undefined ? { isActive: body.data.isActive } : {}),
      ...(body.data.blocked !== undefined ? { blocked: body.data.blocked } : {}),
      ...(passwordHash ? { passwordHash } : {}),
      ...(names
        ? {
            profile: {
              upsert: {
                create: { firstName: names.firstName, lastName: names.lastName },
                update: { firstName: names.firstName, lastName: names.lastName },
              },
            },
          }
        : {}),
    },
  });

  revalidatePath("/admin/musteriler");
  revalidatePath(`/admin/musteriler/${id}`);
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  if (id === admin.id) return jsonError("Kendi hesabınızı silemezsiniz.");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, _count: { select: { orders: true } } },
  });
  if (!user) return jsonError("Kullanıcı bulunamadı", 404);
  if (isStaffRole(user.role)) return jsonError("Yönetici hesabı silinemez");
  if (user._count.orders > 0) return jsonError("Siparişi olan müşteri silinemez. Pasif veya engelli yapın.");

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/musteriler");
  return Response.json({ ok: true });
}

