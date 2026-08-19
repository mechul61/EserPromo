import { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { buildReportTable, logReportRun, toCsv } from "@/lib/commerce/reports";
import { jsonError } from "@/lib/security/origin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const report = await prisma.savedReport.findUnique({ where: { id } });
  if (!report) return jsonError("Rapor bulunamadı", 404);

  const table = await buildReportTable(report.source);
  const preview = req.nextUrl.searchParams.get("preview") === "1";
  await logReportRun(report.id, preview ? "view" : "download", table.rows.length);

  if (preview) {
    return Response.json({
      ok: true,
      name: report.name,
      source: report.source,
      headers: table.headers,
      rows: table.rows.slice(0, 80),
      total: table.rows.length,
    });
  }

  const slug = report.name.replace(/[^\w\-]+/g, "-").slice(0, 40) || "rapor";
  return new Response(toCsv(table), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.csv"`,
    },
  });
}
