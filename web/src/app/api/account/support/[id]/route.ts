import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { findOwnedSupportTicket } from "@/lib/commerce/support";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
});

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const { id } = await ctx.params;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Puan geçersiz.");

  const ticket = await findOwnedSupportTicket(user.id, user.email, id);
  if (!ticket) return jsonError("Talep bulunamadı", 404);
  if (ticket.status !== "resolved") return jsonError("Yalnızca çözülen talepler puanlanabilir.");
  if (ticket.rating) return jsonError("Bu talep zaten puanlandı.");

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { rating: body.data.rating },
  });
  revalidatePath("/admin/destek");
  revalidatePath("/hesabim/destek");
  return Response.json({ ok: true });
}
