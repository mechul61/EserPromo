import { AccountPlaceholder } from "@/components/account/AccountPlaceholder";

export const metadata = {
  title: "Teklif Taleplerim",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AccountPlaceholder
      title="Teklif Taleplerim"
      text="Toplu sipariş teklifleriniz burada listelenecek."
    />
  );
}
