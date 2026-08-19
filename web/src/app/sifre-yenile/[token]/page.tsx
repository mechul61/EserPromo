import { ShopChrome } from "@/components/layout/ShopChrome";
import { ResetPasswordForm } from "@/components/commerce/ResetPasswordForm";

export const metadata = {
  title: "Şifre Yenile",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <ShopChrome skipMaintenance>
      <h1 className="mb-6 text-center text-[24px] font-extrabold text-navy">Yeni Şifre</h1>
      <ResetPasswordForm token={token} />
    </ShopChrome>
  );
}
