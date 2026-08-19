import { ReportsPageView, type ReportKpi, type SavedReportRow } from "@/components/admin/ReportsPageView";
import { prisma } from "@/lib/db";
import {
  ensureSavedReports,
  REPORT_CATEGORY_LABEL,
  REPORT_KIND_LABEL,
  REPORT_SCHEDULE_LABEL,
  runDueScheduledReports,
  type ReportCategoryId,
  type ReportKindId,
  type ReportScheduleId,
} from "@/lib/commerce/reports";

export const dynamic = "force-dynamic";
export const metadata = { title: "Raporlar | Yönetim" };

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function weekBuckets(dates: Date[]) {
  const now = Date.now();
  return Array.from({ length: 8 }, (_, i) => {
    const from = now - (8 - i) * 7 * 24 * 60 * 60 * 1000;
    const to = now - (7 - i) * 7 * 24 * 60 * 60 * 1000;
    return dates.filter((date) => date.getTime() >= from && date.getTime() < to).length;
  });
}

export default async function AdminReportsPage() {
  await ensureSavedReports();
  await runDueScheduledReports();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [reports, createdThis, createdPrev, downloadsThis, downloadsPrev, ordersThis, ordersPrev, usersThis, itemsThis] =
    await Promise.all([
      prisma.savedReport.findMany({
        orderBy: [{ runCount: "desc" }, { createdAt: "desc" }],
        include: { runs: { select: { createdAt: true, action: true }, orderBy: { createdAt: "desc" }, take: 40 } },
      }),
      prisma.savedReport.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.savedReport.count({ where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
      prisma.reportRun.count({ where: { action: "download", createdAt: { gte: monthStart } } }),
      prisma.reportRun.count({ where: { action: "download", createdAt: { gte: prevMonthStart, lt: monthStart } } }),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.order.count({ where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.orderItem.count({ where: { order: { createdAt: { gte: monthStart } } } }),
    ]);

  const rows: SavedReportRow[] = reports.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    source: row.source,
    category: row.category as ReportCategoryId,
    categoryLabel: REPORT_CATEGORY_LABEL[row.category],
    kind: row.kind as ReportKindId,
    kindLabel: REPORT_KIND_LABEL[row.kind],
    icon: row.icon,
    schedule: row.schedule as ReportScheduleId,
    scheduleLabel: REPORT_SCHEDULE_LABEL[row.schedule],
    isShared: row.isShared,
    isSystem: row.isSystem,
    creatorName: row.creatorName,
    runCount: row.runCount,
    lastRunAt: row.lastRunAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    spark: weekBuckets(row.runs.map((run) => run.createdAt)),
  }));

  const scheduled = rows.filter((row) => row.schedule !== "none").length;
  const recordsThis = ordersThis + usersThis + itemsThis;
  const recordsPrev = ordersPrev;

  const kpis: ReportKpi[] = [
    { label: "Toplam Rapor", value: rows.length.toLocaleString("tr-TR"), hint: "Tüm zamanlar", color: "bg-[#2f6bff]", icon: "total" },
    { label: "Bu Ay Oluşturulan", value: createdThis.toLocaleString("tr-TR"), delta: pct(createdThis, createdPrev), color: "bg-[#22c55e]", icon: "created" },
    { label: "İndirilen Rapor", value: downloadsThis.toLocaleString("tr-TR"), delta: pct(downloadsThis, downloadsPrev), color: "bg-[#f59e0b]", icon: "download" },
    { label: "Zamanlanan Rapor", value: scheduled.toLocaleString("tr-TR"), hint: "Aktif raporlar", color: "bg-[#7c3aed]", icon: "schedule" },
    { label: "Toplam Kayıt", value: recordsThis.toLocaleString("tr-TR"), delta: pct(recordsThis, recordsPrev), color: "bg-[#ec4899]", icon: "records" },
  ];

  const categoryCounts = (Object.keys(REPORT_CATEGORY_LABEL) as ReportCategoryId[]).map((id) => ({
    id,
    label: REPORT_CATEGORY_LABEL[id],
    count: rows.filter((row) => row.category === id).length,
  }));

  return <ReportsPageView reports={rows} kpis={kpis} categoryCounts={categoryCounts} />;
}
