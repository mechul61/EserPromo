import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AuthUser } from "@/lib/auth/session";

export function AdminChrome({
  user,
  children,
  supportWaiting = 0,
  ordersWaiting = 0,
}: {
  user: AuthUser;
  children: React.ReactNode;
  supportWaiting?: number;
  ordersWaiting?: number;
}) {
  return (
    <div className="h-dvh overflow-hidden bg-[#171b22] p-3">
      <div className="grid h-[calc(100dvh-24px)] max-h-[calc(100dvh-24px)] overflow-hidden rounded-[18px] bg-[#f5f7fb] grid-cols-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[250px_minmax(0,1fr)] lg:grid-rows-none">
        <div className="min-h-0 overflow-hidden lg:h-full">
          <Suspense fallback={<aside className="h-full bg-[#0b1524]" />}>
            <AdminSidebar name={user.name} supportWaiting={supportWaiting} ordersWaiting={ordersWaiting} />
          </Suspense>
        </div>
        <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain p-4 lg:p-5">{children}</div>
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
