import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { canManageStaff } from "@/lib/admin/staff-copy";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  if (!canManageStaff(admin.role)) return jsonError("Oturum kapatma yetkiniz yok.", 403);

  const { id } = await ctx.params;
  const session = await prisma.session.findUnique({ where: { id }, select: { id: true, userId: true } });
  if (!session) return jsonError("Oturum bulunamadı", 404);
  if (session.userId === admin.id) return jsonError("Kendi aktif oturumunuzu buradan kapatamazsınız.");

  await prisma.session.delete({ where: { id } });
  revalidatePath("/admin/kullanicilar");
  return Response.json({ ok: true });
}
