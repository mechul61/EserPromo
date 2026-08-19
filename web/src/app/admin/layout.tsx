import { AdminChrome } from "@/components/admin/AdminChrome";
import { requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Yönetim",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [supportWaiting, ordersWaiting] = await Promise.all([
    prisma.supportTicket.count({ where: { status: "waiting" } }).catch(() => 0),
    prisma.order
      .count({
        where: { status: { in: ["pending_payment", "paid"] } },
      })
      .catch(() => 0),
  ]);
  return (
    <AdminChrome user={user} supportWaiting={supportWaiting} ordersWaiting={ordersWaiting}>
      {children}
    </AdminChrome>
  );
}
