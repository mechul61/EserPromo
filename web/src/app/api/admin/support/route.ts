import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { createSupportTicket } from "@/lib/commerce/support";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  subject: z.string().trim().min(4).max(140),
  body: z.string().trim().min(10).max(4000),
  category: z.enum(["order", "returns", "payment", "invoice", "cargo", "account", "other"]).default("other"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
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
  if (!body.success) return jsonError("Talep bilgilerini kontrol edin");

  const ticket = await createSupportTicket({
    name: body.data.name,
    email: body.data.email,
    phone: body.data.phone,
    subject: body.data.subject,
    body: body.data.body,
    category: body.data.category,
    priority: body.data.priority,
  });
  revalidatePath("/admin/destek");
  revalidatePath("/hesabim/destek");
  return Response.json({ ok: true, id: ticket.id });
}
