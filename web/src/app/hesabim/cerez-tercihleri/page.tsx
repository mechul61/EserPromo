import { redirect } from "next/navigation";
import { AccountChrome } from "@/components/account/AccountChrome";
import { AccountCookiePreferences } from "@/components/account/AccountCookiePreferences";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountCookiePreferences } from "@/lib/account";

export const metadata = {
  title: "Çerez Tercihleri",
  robots: { index: false, follow: false },
};

export default async function CookiePreferencesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const prefs = await getAccountCookiePreferences(user.id);

  return (
    <AccountChrome
      title="Çerez Tercihleri"
      subtitle="İsteğe bağlı çerez tercihlerinizi buradan güncelleyebilirsiniz."
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: "Çerez Tercihleri" },
      ]}
    >
      <AccountCookiePreferences initial={prefs} />
    </AccountChrome>
  );
}
