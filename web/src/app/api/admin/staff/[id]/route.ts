import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { canManageStaff, isStaffRole } from "@/lib/admin/staff-copy";
import { prisma } from "@/lib/db";
import { normalizeEmail } from "@/lib/security/crypto";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(120).optional(),
  password: z.string().trim().min(8).max(72).optional(),
  role: z.enum(["admin", "editor", "support", "content", "super_admin"]).optional(),
  isActive: z.boolean().optional(),
  revokeSessions: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  if (!canManageStaff(admin.role)) return jsonError("Personel düzenleme yetkiniz yok.", 403);

  const { id } = await ctx.params;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return jsonError("Kullanıcı bulunamadı", 404);
  if (!isStaffRole(user.role)) return jsonError("Bu sayfadan yalnızca personel düzenlenir.");

  if (id === admin.id && body.data.isActive === false) {
    return jsonError("Kendi hesabınızı pasifleştiremezsiniz.");
  }

  if (body.data.role === "super_admin" && admin.role !== "super_admin") {
    return jsonError("Super Admin yalnızca Super Admin tarafından atanır.");
  }

  if ((body.data.role && body.data.role !== "super_admin") || body.data.isActive === false) {
    if (user.role === "super_admin") {
      const supers = await prisma.user.count({ where: { role: "super_admin", isActive: true } });
      if (supers <= 1) return jsonError("Son Super Admin rolü değiştirilemez.");
    }
  }

  if (body.data.email) {
    const email = normalizeEmail(body.data.email);
    const taken = await prisma.user.findFirst({ where: { email, NOT: { id } }, select: { id: true } });
    if (taken) return jsonError("Bu e-posta zaten kayıtlı");
  }

  let passwordHash: string | undefined;
  if (body.data.password) {
    const policy = passwordPolicyError(body.data.password);
    if (policy) return jsonError(policy);
    passwordHash = await hashPassword(body.data.password);
  }

  await prisma.user.update({
    where: { id },
    data: {
      ...(body.data.name ? { name: body.data.name.trim() } : {}),
      ...(body.data.email ? { email: normalizeEmail(body.data.email) } : {}),
      ...(body.data.role ? { role: body.data.role } : {}),
      ...(body.data.isActive !== undefined ? { isActive: body.data.isActive, blocked: body.data.isActive ? false : user.blocked } : {}),
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  if (body.data.revokeSessions && id !== admin.id) {
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  revalidatePath("/admin/kullanicilar");
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  if (!canManageStaff(admin.role)) return jsonError("Personel silme yetkiniz yok.", 403);

  const { id } = await ctx.params;
  if (id === admin.id) return jsonError("Kendi hesabınızı silemezsiniz.");

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, _count: { select: { orders: true } } },
  });
  if (!user) return jsonError("Kullanıcı bulunamadı", 404);
  if (!isStaffRole(user.role)) return jsonError("Bu sayfadan yalnızca personel silinir.");
  if (user.role === "super_admin") {
    const supers = await prisma.user.count({ where: { role: "super_admin" } });
    if (supers <= 1) return jsonError("Son Super Admin silinemez.");
  }

  await prisma.session.deleteMany({ where: { userId: id } });
  if (user._count.orders > 0) {
    await prisma.user.update({ where: { id }, data: { isActive: false, role: "customer" } });
  } else {
    await prisma.user.delete({ where: { id } });
  }

  revalidatePath("/admin/kullanicilar");
  return Response.json({ ok: true });
}
