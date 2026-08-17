import { AdminHeading } from "@/components/admin/AdminChrome";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";

export const metadata = { title: "Senkron | Yönetim" };

export default async function AdminSyncPage() {
  const runs = await prisma.syncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <AdminHeading
        title="Katalog senkronu"
        subtitle="Etkin API senkron kayıtları. Yeni senkron `npm run sync` ile çalışır."
      />
      <div className="overflow-x-auto rounded-md border border-line bg-white">
        {runs.length === 0 ? (
          <p className="p-5 text-[13px] text-[#6b7280]">Henüz senkron kaydı yok.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              <tr>
                <th className="px-4 py-2">Başlangıç</th>
                <th className="px-4 py-2">Durum</th>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2">Görsel</th>
                <th className="px-4 py-2">Hata</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-2.5">{formatDateTimeTr(run.startedAt)}</td>
                  <td className="px-4 py-2.5 font-semibold">{run.status}</td>
                  <td className="px-4 py-2.5">{run.productsUpserted.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-2.5">{run.imagesDownloaded.toLocaleString("tr-TR")}</td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-brand-red">{run.errorMessage || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
