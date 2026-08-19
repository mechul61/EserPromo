import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { CUSTOMER_GROUPS } from "@/lib/admin/customer-input";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  action: z.enum(["activate", "deactivate", "block", "unblock", "group"]),
  customerGroup: z.enum(CUSTOMER_GROUPS).optional(),
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
  if (!body.success) return jsonError("Müşteri seçin");
  if (body.data.action === "group" && !body.data.customerGroup) return jsonError("Grup seçin");

  const ids = [...new Set(body.data.ids)].filter((id) => id !== admin.id);
  if (ids.length === 0) return jsonError("Geçerli müşteri seçin");

  await prisma.user.updateMany({
    where: { id: { in: ids }, role: "customer" },
    data:
      body.data.action === "activate"
        ? { isActive: true, blocked: false }
        : body.data.action === "deactivate"
          ? { isActive: false }
          : body.data.action === "block"
            ? { blocked: true }
            : body.data.action === "unblock"
              ? { blocked: false, isActive: true }
              : { customerGroup: body.data.customerGroup },
  });

  revalidatePath("/admin/musteriler");
  return Response.json({ ok: true, count: ids.length });
}
