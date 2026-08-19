import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { ForgotPasswordForm } from "@/components/commerce/ForgotPasswordForm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin";
import { isRecaptchaEnabled, recaptchaSiteKeyForClient } from "@/lib/security/recaptcha";

export const metadata = {
  title: "Şifremi Unuttum",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect(isAdminUser(user) ? "/admin" : "/hesabim");
  const recaptchaEnabled = await isRecaptchaEnabled();
  const recaptchaSiteKey = recaptchaSiteKeyForClient();

  return (
    <ShopChrome skipMaintenance>
      <h1 className="mb-6 text-center text-[24px] font-extrabold text-navy">Şifremi Unuttum</h1>
      <ForgotPasswordForm recaptchaEnabled={recaptchaEnabled} recaptchaSiteKey={recaptchaSiteKey} />
      <p className="mt-4 text-center text-[13px] text-muted">
        Şifrenizi hatırladınız mı?{" "}
        <Link href="/giris" className="font-semibold text-navy">
          Giriş yapın
        </Link>
      </p>
    </ShopChrome>
  );
}
