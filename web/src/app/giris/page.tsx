import Link from "next/link";
import { redirect } from "next/navigation";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { AuthForm } from "@/components/commerce/AuthForm";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/admin";
import { isRecaptchaEnabled } from "@/lib/security/recaptcha";

export const metadata = {
  title: "Giriş Yap",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(isAdminUser(user) ? "/admin" : "/hesabim");
  const recaptchaEnabled = await isRecaptchaEnabled();

  return (
    <ShopChrome skipMaintenance>
      <h1 className="mb-6 text-center text-[24px] font-extrabold text-navy">Giriş Yap</h1>
      <AuthForm mode="login" recaptchaEnabled={recaptchaEnabled} />
      <p className="mt-4 text-center text-[13px] text-muted">
        Hesabınız yok mu?{" "}
        <Link href="/kayit" className="font-semibold text-navy">
          Üye olun
        </Link>
      </p>
    </ShopChrome>
  );
}
