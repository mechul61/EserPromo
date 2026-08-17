import { redirect } from "next/navigation";
import { AccountChrome } from "@/components/account/AccountChrome";
import { AddressesView } from "@/components/account/AddressesView";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Adreslerim",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <AccountChrome
      title="Adreslerim"
      subtitle="Kayıtlı teslimat adresleriniz."
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: "Adreslerim" },
      ]}
    >
      <AddressesView
        userEmail={user.email}
        initial={addresses.map((address) => ({
          id: address.id,
          title: address.title,
          fullName: address.fullName,
          email: address.email,
          phone: address.phone,
          country: address.country,
          city: address.city,
          district: address.district,
          postalCode: address.postalCode,
          line: address.line,
          isDefault: address.isDefault,
        }))}
      />
    </AccountChrome>
  );
}
