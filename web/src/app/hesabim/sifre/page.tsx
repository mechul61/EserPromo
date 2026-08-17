import { AccountChrome } from "@/components/account/AccountChrome";
import { PasswordView } from "@/components/account/PasswordView";

export const metadata = {
  title: "Şifre Değiştir",
  robots: { index: false, follow: false },
};

export default function PasswordPage() {
  return (
    <AccountChrome
      title="Şifre Değiştir"
      subtitle="Hesabınızın güvenliği için şifrenizi düzenli olarak güncelleyin."
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: "Şifre Değiştir" },
      ]}
    >
      <PasswordView />
    </AccountChrome>
  );
}
