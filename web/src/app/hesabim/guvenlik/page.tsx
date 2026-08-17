import { redirect } from "next/navigation";
import { AccountChrome } from "@/components/account/AccountChrome";
import { SecurityView } from "@/components/account/SecurityView";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountOverview } from "@/lib/account";
import { listLoginEvents } from "@/lib/auth/login-events";
import { deviceLabel, formatDateTimeTr } from "@/lib/auth/login-meta";

export const metadata = {
  title: "Hesap Güvenliği",
  robots: { index: false, follow: false },
};

export default async function SecurityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const overview = await getAccountOverview(user.id);
  const rows = await listLoginEvents(user.id, overview.user.email);

  return (
    <AccountChrome
      title="Hesap Güvenliği"
      subtitle="Oturum ve güvenlik bilgileriniz."
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: "Hesap Güvenliği" },
      ]}
    >
      <SecurityView
        email={overview.user.email}
        lastLogin={overview.stats.lastLogin}
        memberSince={overview.stats.memberSince}
        events={rows.map((row) => ({
          id: row.id,
          email: row.email,
          at: formatDateTimeTr(row.createdAt),
          device: deviceLabel(row.userAgent),
          ip: row.ip,
          source: row.source,
        }))}
      />
    </AccountChrome>
  );
}
