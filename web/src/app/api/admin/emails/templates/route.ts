import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(160),
  heading: z.string().trim().max(160).optional().or(z.literal("")),
  body: z.string().trim().min(4).max(8000),
  ctaLabel: z.string().trim().max(80).optional().or(z.literal("")),
  ctaUrl: z.string().trim().max(300).optional().or(z.literal("")),
  category: z.enum(["order", "customer", "marketing", "other"]).default("other"),
  language: z.enum(["tr", "en"]).default("tr"),
  isActive: z.boolean().optional(),
  showOrderBox: z.boolean().optional(),
});

function keyFromName(name: string) {
  const base = name
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  return `${base || "sablon"}_${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Şablon bilgilerini kontrol edin");

  const row = await prisma.emailTemplate.create({
    data: {
      key: keyFromName(body.data.name),
      name: body.data.name,
      description: body.data.description ?? "",
      subject: body.data.subject,
      heading: body.data.heading ?? "",
      body: body.data.body,
      ctaLabel: body.data.ctaLabel ?? "",
      ctaUrl: body.data.ctaUrl ?? "",
      category: body.data.category,
      language: body.data.language,
      icon: "mail",
      isActive: body.data.isActive ?? true,
      showOrderBox: body.data.showOrderBox ?? false,
      isSystem: false,
    },
  });
  revalidatePath("/admin/eposta");
  return Response.json({ ok: true, id: row.id });
}
