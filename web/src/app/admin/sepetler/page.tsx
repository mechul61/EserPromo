import { AdminHeading } from "@/components/admin/AdminChrome";
import { CartsGrid } from "@/components/grid/AdminGrids";
import { cartMoneySummary } from "@/lib/commerce/cart";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sepetler | Yönetim" };

export default async function AdminCartsPage() {
  const carts = await prisma.cart.findMany({
    where: { items: { some: {} } },
    orderBy: { updatedAt: "desc" },
    take: 2000,
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { name: true, price: true, vatRate: true } },
        },
      },
    },
  });

  return (
    <div>
      <AdminHeading
        title="Aktif sepetler"
        subtitle={`${carts.length.toLocaleString("tr-TR")} dolu sepet · siparişe dönüşmemiş ürünler`}
      />
      <CartsGrid
        rows={carts.map((cart) => {
          const summary = cartMoneySummary(cart.items);
          return {
            id: cart.id,
            customer: cart.user?.name ?? "Misafir",
            email: cart.user?.email ?? "",
            products: `${summary.preview || "—"}${summary.lines > 2 ? ` +${summary.lines - 2}` : ""}`,
            quantity: summary.quantity,
            total: summary.grand,
            updatedAt: cart.updatedAt.toISOString(),
          };
        })}
      />
    </div>
  );
}
