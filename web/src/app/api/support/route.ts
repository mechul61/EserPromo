import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupportTicket } from "@/lib/commerce/support";
import { assertRecaptcha, recaptchaClientIp } from "@/lib/security/recaptcha";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  subject: z.string().trim().min(4).max(140),
  body: z.string().trim().min(10).max(4000),
  category: z.enum(["order", "returns", "payment", "invoice", "cargo", "account", "other"]).default("other"),
  recaptchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  if (!rateLimit(clientKey(req, "support"), 8, 15 * 60 * 1000)) {
    return jsonError("Çok fazla deneme. Bir süre sonra tekrar deneyin.", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Talep bilgilerini kontrol edin.");

  const human = await assertRecaptcha(body.data.recaptchaToken, recaptchaClientIp(req));
  if (!human) return jsonError("Robot doğrulaması başarısız. Tekrar deneyin.");

  const user = await getCurrentUser();
  const ticket = await createSupportTicket({
    userId: user?.id,
    name: body.data.name,
    email: body.data.email,
    phone: body.data.phone,
    subject: body.data.subject,
    body: body.data.body,
    category: body.data.category,
  });
  revalidatePath("/admin/destek");
  revalidatePath("/hesabim/destek");
  return Response.json({ ok: true, publicNumber: ticket.publicNumber });
}
