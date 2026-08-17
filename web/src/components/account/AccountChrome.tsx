import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { AccountAside } from "@/components/account/AccountAside";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureAdmin } from "@/lib/auth/admin";
import { getAccountOverview } from "@/lib/account";

export async function AccountChrome({
  children,
  title,
  subtitle,
  crumbs,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  crumbs: { href?: string; label: string }[];
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const resolved = (await ensureAdmin(user)) ?? user;
  const overview = await getAccountOverview(resolved.id);

  return (
    <ShopChrome mainClassName="py-6">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
        <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
          <Home className="size-3.5" />
        </Link>
        {crumbs.map((crumb) => (
          <span key={crumb.label} className="inline-flex items-center gap-1.5">
            <ChevronRight className="size-3" />
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-navy">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[#555]">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <AccountSidebar isAdmin={resolved.role === "admin"} />
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold tracking-wide text-[#111] uppercase">{title}</h1>
          {subtitle ? <p className="mt-1 text-[13px] text-[#6b7280]">{subtitle}</p> : null}
          <div className="mt-5">{children}</div>
        </div>
        <div className="xl:sticky xl:top-4">
          <AccountAside
            orderCount={overview.stats.orderCount}
            spent={overview.stats.spent}
            memberSince={overview.stats.memberSince}
            lastLogin={overview.stats.lastLogin}
          />
        </div>
      </div>
    </ShopChrome>
  );
}
