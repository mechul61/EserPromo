import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { addSupportMessage } from "@/lib/commerce/support";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  status: z.enum(["open", "waiting", "resolved", "archived"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  body: z.string().trim().min(2).max(4000).optional(),
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
  if (!body.success) return jsonError("Geçersiz istek");

  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return jsonError("Talep bulunamadı", 404);

  if (body.data.body) {
    try {
      await addSupportMessage({
        ticketId: ticket.id,
        author: "admin",
        authorName: admin.name || "Yönetici",
        body: body.data.body,
      });
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : "Yanıt eklenemedi");
    }
  }

  if (body.data.status || body.data.priority) {
    await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(body.data.status
          ? {
              status: body.data.status,
              resolvedAt:
                body.data.status === "resolved"
                  ? new Date()
                  : body.data.status === "archived"
                    ? ticket.resolvedAt
                    : null,
            }
          : {}),
        ...(body.data.priority ? { priority: body.data.priority } : {}),
      },
    });
  }

  revalidatePath("/admin/destek");
  revalidatePath("/hesabim/destek");
  return Response.json({ ok: true });
}
