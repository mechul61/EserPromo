import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupportTicket } from "@/lib/commerce/support";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  subject: z.string().trim().min(4).max(140),
  body: z.string().trim().min(10).max(4000),
  category: z.enum(["order", "returns", "payment", "invoice", "cargo", "account", "other"]).default("other"),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);
  if (!rateLimit(clientKey(req, `support:${user.id}`), 10, 15 * 60 * 1000)) {
    return jsonError("Çok fazla deneme.", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Talep bilgilerini kontrol edin.");

  const ticket = await createSupportTicket({
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: body.data.phone,
    subject: body.data.subject,
    body: body.data.body,
    category: body.data.category,
  });
  revalidatePath("/admin/destek");
  revalidatePath("/hesabim/destek");
  return Response.json({ ok: true, id: ticket.id, publicNumber: ticket.publicNumber });
}
