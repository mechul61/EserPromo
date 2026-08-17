import { AccountPlaceholder } from "@/components/account/AccountPlaceholder";

export const metadata = {
  title: "Bildirimlerim",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AccountPlaceholder
      title="Bildirimlerim"
      text="Sipariş ve kampanya bildirimleriniz burada toplanacak."
    />
  );
}
