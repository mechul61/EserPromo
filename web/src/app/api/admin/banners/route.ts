import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { bannerWriteSchema, parseOptionalDate } from "@/lib/admin/banner-input";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

function revalidateBanners() {
  revalidatePath("/admin/bannerlar");
  revalidatePath("/");
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = bannerWriteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Başlık ve görsel gerekli");

  const banner = await prisma.banner.create({
    data: {
      kind: body.data.kind ?? "banner",
      title: body.data.title,
      href: body.data.href ?? "",
      imagePath: body.data.imagePath,
      width: body.data.width ?? 1920,
      height: body.data.height ?? 600,
      placement: body.data.placement ?? "hero",
      isActive: body.data.isActive ?? true,
      startsAt: parseOptionalDate(body.data.startsAt),
      endsAt: parseOptionalDate(body.data.endsAt),
      minAmount: body.data.minAmount ?? 0,
      maxAmount: body.data.maxAmount ?? 0,
      sortOrder: body.data.sortOrder ?? 0,
    },
    select: { id: true },
  });

  revalidateBanners();
  return Response.json({ ok: true, id: banner.id });
}
