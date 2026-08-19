import { AdminHeading } from "@/components/admin/AdminChrome";
import { RecaptchaSetting } from "@/components/admin/RecaptchaSetting";
import { isRecaptchaEnabled } from "@/lib/security/recaptcha";

export const metadata = { title: "Güvenlik | Yönetim" };

export default async function AdminSecurityPage() {
  const recaptchaEnabled = await isRecaptchaEnabled();

  return (
    <div>
      <AdminHeading
        title="Güvenlik"
        subtitle="Giriş ve üyelik korumasını buradan açıp kapatabilirsiniz."
      />
      <RecaptchaSetting enabled={recaptchaEnabled} />
    </div>
  );
}
