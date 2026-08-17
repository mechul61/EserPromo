import { AdminChrome } from "@/components/admin/AdminChrome";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Yönetim",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <AdminChrome user={user}>{children}</AdminChrome>;
}
