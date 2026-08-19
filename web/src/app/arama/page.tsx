import Link from "next/link";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { prisma } from "@/lib/db";
import { productPath } from "@/lib/seo/urls";

export const metadata = {
  title: "Arama",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);

  const products = query
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          removed: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { title: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 40,
        orderBy: [{ stockTotal: "desc" }, { name: "asc" }],
      })
    : [];

  return (
    <ShopChrome>
      <h1 className="text-[24px] font-extrabold text-navy">Arama</h1>
      {query ? (
        <p className="mt-2 text-[14px] text-muted">“{query}” için sonuçlar</p>
      ) : (
        <p className="mt-2 text-muted">Aramak için üstteki kutuyu kullanın.</p>
      )}
      <ul className="mt-6 space-y-2">
        {products.map((p) => (
          <li key={p.id}>
            <Link href={productPath(p.slug)} className="font-semibold text-navy">
              {p.title || p.name}
            </Link>
          </li>
        ))}
      </ul>
    </ShopChrome>
  );
}
