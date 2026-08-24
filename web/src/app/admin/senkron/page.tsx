import { AdminHeading } from "@/components/admin/AdminChrome";
import { SyncPageView } from "@/components/admin/SyncPageView";
import { prisma } from "@/lib/db";
import { decideScheduledRun, getSyncSchedule } from "@/lib/etkin/sync-schedule";

export const metadata = { title: "Entegrasyon | Yönetim" };
export const dynamic = "force-dynamic";

export default async function AdminSyncPage() {
  const [runs, schedule] = await Promise.all([
    prisma.syncRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
    getSyncSchedule(),
  ]);
  const decision = decideScheduledRun(schedule);

  return (
    <div>
      <AdminHeading
        title="Entegrasyon"
        subtitle="Etkin API üzerinden kategori, ürün ve görsel senkronizasyonu. İşlemleri buradan başlatıp takip edebilirsiniz."
      />
      <SyncPageView
        initialSchedule={schedule}
        initialDecision={decision.run ? { due: true } : { due: false, reason: decision.reason }}
        initialRuns={runs.map((run) => ({
          id: run.id,
          startedAt: run.startedAt.toISOString(),
          finishedAt: run.finishedAt?.toISOString() ?? null,
          status: run.status,
          requestCount: run.requestCount,
          categoriesUpsert: run.categoriesUpsert,
          productsUpserted: run.productsUpserted,
          imagesDownloaded: run.imagesDownloaded,
          errorMessage: run.errorMessage,
        }))}
      />
    </div>
  );
}
