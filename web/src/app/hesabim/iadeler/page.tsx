import { AccountPlaceholder } from "@/components/account/AccountPlaceholder";

export const metadata = {
  title: "İade & Değişim Taleplerim",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AccountPlaceholder
      title="İade & Değişim Taleplerim"
      text="İade ve değişim talepleriniz burada görünecek."
    />
  );
}
