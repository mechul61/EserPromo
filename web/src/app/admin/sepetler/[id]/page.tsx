import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminHeading } from "@/components/admin/AdminChrome";
import { CartDetailView } from "@/components/admin/CartDetailView";
import { cartMoneySummary } from "@/lib/commerce/cart";
import { prisma } from "@/lib/db";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { mediaUrl } from "@/lib/media";
import { productPath } from "@/lib/seo/urls";

export const metadata = { title: "Sepet | Yönetim" };

export default async function AdminCartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cart = await prisma.cart.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: {
            select: {
              name: true,
              title: true,
              sku: true,
              slug: true,
              price: true,
              vatRate: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { localPath: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!cart) notFound();

  const lines = cart.items.map((item) => {
    const line = cartMoneySummary([item]);
    return {
      id: item.id,
      name: item.product.title || item.product.name,
      sku: item.product.sku,
      href: productPath(item.product.slug),
      quantity: item.quantity,
      vatRate: Number(item.product.vatRate),
      subtotal: line.subtotal,
      vat: line.vat,
      grand: line.grand,
      image: mediaUrl(item.product.images[0]?.localPath) ?? "/brand/logo.png",
    };
  });

  return (
    <div>
      <Link
        href="/admin/sepetler"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-bold text-navy hover:text-orange"
      >
        <ArrowLeft className="size-4" />
        Sepetlere dön
      </Link>
      <AdminHeading
        title={cart.user?.name ?? "Misafir sepeti"}
        subtitle={cart.user?.email ?? "Üye olmadan eklenen ürünler"}
      />

      {cart.user ? (
        <p className="mb-4 text-[13px]">
          <Link href={`/admin/musteriler/${cart.user.id}`} className="font-bold text-navy hover:text-orange">
            Müşteri kaydına git
          </Link>
        </p>
      ) : null}

      <CartDetailView updatedAt={formatDateTimeTr(cart.updatedAt)} lines={lines} />
    </div>
  );
}
