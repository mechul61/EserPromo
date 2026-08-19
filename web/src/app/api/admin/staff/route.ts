import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { canManageStaff, isStaffRole, type StaffRoleId } from "@/lib/admin/staff-copy";
import { prisma } from "@/lib/db";
import { normalizeEmail, randomToken } from "@/lib/security/crypto";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().trim().max(72).optional().or(z.literal("")),
  role: z.enum(["admin", "editor", "support", "content", "super_admin"]).default("admin"),
});

function generatedPassword() {
  return `Ep1!${randomToken(6)}`;
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  if (!canManageStaff(admin.role)) return jsonError("Personel ekleme yetkiniz yok.", 403);

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Ad, e-posta ve rol gerekli.");

  let role: StaffRoleId = body.data.role;
  if (role === "super_admin" && admin.role !== "super_admin") {
    return jsonError("Super Admin yalnızca Super Admin tarafından atanır.");
  }
  if (!isStaffRole(role)) return jsonError("Geçersiz rol");

  const email = normalizeEmail(body.data.email);
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return jsonError("Bu e-posta zaten kayıtlı");

  const password = body.data.password?.trim() || generatedPassword();
  const policy = passwordPolicyError(password);
  if (policy) return jsonError(policy);

  const user = await prisma.user.create({
    data: {
      email,
      name: body.data.name.trim(),
      passwordHash: await hashPassword(password),
      role,
      isActive: true,
      blocked: false,
    },
    select: { id: true, email: true },
  });

  revalidatePath("/admin/kullanicilar");
  return Response.json({
    ok: true,
    id: user.id,
    email: user.email,
    password: body.data.password ? undefined : password,
  });
}
