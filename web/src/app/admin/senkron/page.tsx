import { AdminHeading } from "@/components/admin/AdminChrome";
import { SyncGrid } from "@/components/grid/AdminGrids";
import { prisma } from "@/lib/db";

export const metadata = { title: "Senkron | Yönetim" };

export default async function AdminSyncPage() {
  const runs = await prisma.syncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <AdminHeading
        title="Katalog senkronu"
        subtitle="Etkin API senkron kayıtları. Yeni senkron `npm run sync` ile çalışır."
      />
      <SyncGrid
        rows={runs.map((run) => ({
          id: String(run.id),
          startedAt: run.startedAt.toISOString(),
          status: run.status,
          products: run.productsUpserted,
          images: run.imagesDownloaded,
          error: run.errorMessage || "—",
        }))}
      />
    </div>
  );
}
