import { redirect } from "next/navigation";
import { AccountChrome } from "@/components/account/AccountChrome";
import { ProfileView } from "@/components/account/ProfileView";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccountOverview } from "@/lib/account";

export const metadata = {
  title: "Profil Bilgilerim",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const overview = await getAccountOverview(user.id);

  return (
    <AccountChrome
      title="Profil Bilgilerim"
      subtitle="Hesap bilgilerinizi görüntüleyin ve güncelleyin."
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: "Profil Bilgilerim" },
      ]}
    >
      <ProfileView
        initial={{
          firstName: overview.profile.firstName,
          lastName: overview.profile.lastName,
          email: overview.user.email,
          phone: overview.user.phone,
          birthDate: overview.profile.birthDate,
          gender: overview.profile.gender,
          avatarUrl: overview.profile.avatarUrl,
          companyName: overview.profile.companyName,
          companyTitle: overview.profile.companyTitle,
          taxOffice: overview.profile.taxOffice,
          taxNumber: overview.profile.taxNumber,
          tcKimlik: overview.profile.tcKimlik,
          useCorporateDefault: overview.profile.useCorporateDefault,
          notifyEmail: overview.profile.notifyEmail,
          notifySms: overview.profile.notifySms,
          notifyOrder: overview.profile.notifyOrder,
        }}
      />
    </AccountChrome>
  );
}
