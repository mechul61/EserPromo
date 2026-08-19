import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { REPORT_SOURCES, type ReportSourceId } from "@/lib/commerce/reports-copy";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  source: z.string(),
  category: z.enum(["sales", "customer", "product", "finance", "marketing", "other"]).optional(),
  kind: z.enum(["table", "chart"]).optional(),
  schedule: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  isShared: z.boolean().optional(),
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
  if (!body.success) return jsonError("Rapor bilgilerini kontrol edin");
  if (!(body.data.source in REPORT_SOURCES)) return jsonError("Rapor kaynağı geçersiz");

  const source = body.data.source as ReportSourceId;
  const meta = REPORT_SOURCES[source];
  const key = `custom_${source}_${Date.now().toString(36)}`;
  const row = await prisma.savedReport.create({
    data: {
      key,
      name: body.data.name,
      description: body.data.description ?? meta.description,
      source,
      category: body.data.category ?? meta.category,
      kind: body.data.kind ?? meta.kind,
      icon: meta.icon,
      schedule: body.data.schedule ?? "none",
      isShared: body.data.isShared ?? false,
      isSystem: false,
      creatorName: admin.name || "Yönetici",
    },
  });
  revalidatePath("/admin/raporlar");
  return Response.json({ ok: true, id: row.id });
}
