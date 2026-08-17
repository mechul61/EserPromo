import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { prisma } from "@/lib/db";

export const metadata = { title: "Kategoriler | Yönetim" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <AdminHeading title="Kategoriler" subtitle="Anasayfada gösterim ve ürün sayıları." />
      <div className="overflow-x-auto rounded-md border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
            <tr>
              <th className="px-4 py-2">Kategori</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Ürün</th>
              <th className="px-4 py-2">Anasayfa</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-2.5 font-extrabold text-navy">{category.name}</td>
                <td className="px-4 py-2.5 text-[#6b7280]">{category.slug}</td>
                <td className="px-4 py-2.5">{category._count.products.toLocaleString("tr-TR")}</td>
                <td className="px-4 py-2.5">
                  <ActiveToggle
                    href={`/api/admin/categories/${category.id}`}
                    active={category.showOnHomepage}
                    activeLabel="Göster"
                    inactiveLabel="Gizli"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
