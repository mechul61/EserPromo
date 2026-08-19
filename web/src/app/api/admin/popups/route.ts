import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { parseOptionalDate, popupWriteSchema } from "@/lib/admin/popup-input";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

function revalidatePopups() {
  revalidatePath("/admin/popuplar");
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

  const body = popupWriteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Başlık gerekli");

  const popup = await prisma.popup.create({
    data: {
      title: body.data.title,
      description: body.data.description ?? "",
      kind: body.data.kind ?? "subscribe",
      placement: body.data.placement ?? "all",
      device: body.data.device ?? "all",
      audience: body.data.audience ?? "all",
      isDraft: body.data.isDraft ?? false,
      isActive: body.data.isActive ?? true,
      imagePath: body.data.imagePath ?? "",
      heading: body.data.heading ?? "",
      body: body.data.body ?? "",
      ctaLabel: body.data.ctaLabel ?? "",
      ctaHref: body.data.ctaHref ?? "",
      couponCode: body.data.couponCode ?? "",
      startsAt: parseOptionalDate(body.data.startsAt),
      endsAt: parseOptionalDate(body.data.endsAt),
      delaySeconds: body.data.delaySeconds ?? 2,
      frequencyHours: body.data.frequencyHours ?? 24,
      sortOrder: body.data.sortOrder ?? 0,
    },
    select: { id: true },
  });

  revalidatePopups();
  return Response.json({ ok: true, id: popup.id });
}
