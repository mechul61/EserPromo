import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AuthUser } from "@/lib/auth/session";

export function AdminChrome({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-soft">
      <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
        <AdminSidebar name={user.name} />
        <div className="min-w-0 px-5 py-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}

export function AdminHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-[20px] font-extrabold tracking-wide text-navy uppercase">{title}</h1>
      {subtitle ? <p className="mt-1 text-[13px] text-[#6b7280]">{subtitle}</p> : null}
    </header>
  );
}
