import { Suspense } from "react";
import { AdminScrollLock } from "@/components/admin/AdminScrollLock";
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
    <>
      <AdminScrollLock />
      <div className="fixed inset-0 overflow-hidden bg-[#171b22] p-2 sm:p-3">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] bg-[#f5f7fb] lg:flex-row">
          <aside className="min-h-0 shrink-0 overflow-hidden max-lg:max-h-[min(42vh,360px)] lg:h-full lg:w-[250px]">
            <Suspense fallback={<div className="h-full bg-[#0b1524]" />}>
              <AdminSidebar name={user.name} supportWaiting={supportWaiting} ordersWaiting={ordersWaiting} />
            </Suspense>
          </aside>
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </>
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
