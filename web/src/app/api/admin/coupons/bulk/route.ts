import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  action: z.enum(["activate", "deactivate", "delete"]),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Kupon seçin");

  const ids = [...new Set(body.data.ids)];
  if (body.data.action === "delete") {
    await prisma.coupon.deleteMany({ where: { id: { in: ids } } });
  } else {
    await prisma.coupon.updateMany({
      where: { id: { in: ids } },
      data: { isActive: body.data.action === "activate" },
    });
  }

  revalidatePath("/admin/kuponlar");
  return Response.json({ ok: true, count: ids.length });
}
