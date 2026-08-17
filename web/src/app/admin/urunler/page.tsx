import Link from "next/link";
import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { AdminPager, AdminSearch } from "@/components/admin/AdminSearch";
import { prisma } from "@/lib/db";
import { formatPriceTry } from "@/lib/media";
import { productPath } from "@/lib/seo/urls";

export const metadata = { title: "Ürünler | Yönetim" };

const PAGE_SIZE = 24;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: rawPage } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(rawPage) || 1);
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { title: { contains: query, mode: "insensitive" as const } },
          { sku: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { stockTotal: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: { select: { name: true } } },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminHeading title="Ürünler" subtitle={`${total.toLocaleString("tr-TR")} kayıt · katalog Etkin senkronundan gelir`} />
      <div className="mb-4 max-w-xl">
        <AdminSearch action="/admin/urunler" placeholder="Ürün adı veya stok kodu" q={query} />
      </div>
      <div className="overflow-x-auto rounded-md border border-line bg-white">
        {products.length === 0 ? (
          <p className="p-5 text-[13px] text-[#6b7280]">Ürün bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[800px] text-left text-[13px]">
            <thead className="border-b border-line bg-soft text-[11px] font-bold tracking-wide text-[#6b7280] uppercase">
              <tr>
                <th className="px-4 py-2">Ürün</th>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Stok</th>
                <th className="px-4 py-2">Fiyat</th>
                <th className="px-4 py-2">Durum</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link href={productPath(product.slug)} className="font-extrabold text-navy hover:text-orange">
                      {product.title || product.name}
                    </Link>
                    {product.color ? <p className="text-[12px] text-[#6b7280]">{product.color}</p> : null}
                  </td>
                  <td className="px-4 py-2.5">{product.sku}</td>
                  <td className="px-4 py-2.5">{product.category.name}</td>
                  <td className="px-4 py-2.5">{product.stockTotal.toLocaleString("tr-TR")}</td>
                  <td className="px-4 py-2.5 font-extrabold">₺{formatPriceTry(product.price)}</td>
                  <td className="px-4 py-2.5">
                    <ActiveToggle href={`/api/admin/products/${product.id}`} active={product.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AdminPager href="/admin/urunler" page={page} pageCount={pageCount} q={query} />
    </div>
  );
}
