import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(200).optional(),
  subject: z.string().trim().min(2).max(160).optional(),
  heading: z.string().trim().max(160).optional(),
  body: z.string().trim().min(4).max(8000).optional(),
  ctaLabel: z.string().trim().max(80).optional(),
  ctaUrl: z.string().trim().max(300).optional(),
  category: z.enum(["order", "customer", "marketing", "other"]).optional(),
  language: z.enum(["tr", "en"]).optional(),
  isActive: z.boolean().optional(),
  showOrderBox: z.boolean().optional(),
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

  const { id } = await ctx.params;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Şablon bilgilerini kontrol edin");

  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) return jsonError("Şablon bulunamadı", 404);

  await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(body.data.name ? { name: body.data.name } : {}),
      ...(body.data.description !== undefined ? { description: body.data.description } : {}),
      ...(body.data.subject ? { subject: body.data.subject } : {}),
      ...(body.data.heading !== undefined ? { heading: body.data.heading } : {}),
      ...(body.data.body ? { body: body.data.body } : {}),
      ...(body.data.ctaLabel !== undefined ? { ctaLabel: body.data.ctaLabel } : {}),
      ...(body.data.ctaUrl !== undefined ? { ctaUrl: body.data.ctaUrl } : {}),
      ...(body.data.category ? { category: body.data.category } : {}),
      ...(body.data.language ? { language: body.data.language } : {}),
      ...(body.data.isActive !== undefined ? { isActive: body.data.isActive } : {}),
      ...(body.data.showOrderBox !== undefined ? { showOrderBox: body.data.showOrderBox } : {}),
    },
  });
  revalidatePath("/admin/eposta");
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

  const { id } = await ctx.params;
  const existing = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!existing) return jsonError("Şablon bulunamadı", 404);
  if (existing.isSystem) return jsonError("Sistem şablonları silinemez");

  await prisma.emailTemplate.delete({ where: { id } });
  revalidatePath("/admin/eposta");
  return Response.json({ ok: true });
}
