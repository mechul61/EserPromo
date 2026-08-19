import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { addSupportMessage, findOwnedSupportTicket } from "@/lib/commerce/support";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  body: z.string().trim().min(2).max(4000),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const { id } = await ctx.params;
  const ticket = await findOwnedSupportTicket(user.id, user.email, id);
  if (!ticket) return jsonError("Talep bulunamadı", 404);

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Yanıt yazın.");

  try {
    await addSupportMessage({
      ticketId: ticket.id,
      author: "customer",
      authorName: user.name,
      body: body.data.body,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Yanıt eklenemedi");
  }
  revalidatePath("/admin/destek");
  revalidatePath("/hesabim/destek");
  return Response.json({ ok: true });
}
