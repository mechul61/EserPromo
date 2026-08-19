import { AdminHeading } from "@/components/admin/AdminChrome";
import { RecaptchaSetting } from "@/components/admin/RecaptchaSetting";
import { isRecaptchaEnabled, isRecaptchaConfigured } from "@/lib/security/recaptcha";

export const metadata = { title: "Güvenlik | Yönetim" };

export default async function AdminSecurityPage() {
  const [recaptchaEnabled, recaptchaConfigured] = await Promise.all([
    isRecaptchaEnabled(),
    Promise.resolve(isRecaptchaConfigured()),
  ]);

  return (
    <div>
      <AdminHeading
        title="Güvenlik"
        subtitle="Giriş ve üyelik korumasını buradan açıp kapatabilirsiniz."
      />
      <RecaptchaSetting enabled={recaptchaEnabled} configured={recaptchaConfigured} />
    </div>
  );
}
