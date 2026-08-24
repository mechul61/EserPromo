import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const logs = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({
    ok: true,
    logs: logs.map((row) => ({
      id: row.id,
      templateKey: row.templateKey,
      to: row.to,
      subject: row.subject,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}
