import { redirect } from "next/navigation";
import { AccountChrome } from "@/components/account/AccountChrome";
import { NotificationsView } from "@/components/account/NotificationsView";
import { getCurrentUser } from "@/lib/auth/session";
import { listAccountNotifications } from "@/lib/account";

export const metadata = {
  title: "Bildirimlerim",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const items = await listAccountNotifications(user.id);

  return (
    <AccountChrome
      title="Bildirimlerim"
      subtitle="Favori indirimleri ve hesap mesajlarınız."
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: "Bildirimlerim" },
      ]}
    >
      <NotificationsView
        initial={items.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          href: item.href,
          readAt: item.readAt?.toISOString() ?? null,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </AccountChrome>
  );
}
