import { AccountChrome } from "@/components/account/AccountChrome";
import { FavoritesView } from "@/components/account/FavoritesView";
import { getCurrentUser } from "@/lib/auth/session";
import { listFavoriteProducts } from "@/lib/commerce/favorites";

export const metadata = {
  title: "Favorilerim",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  const items = user ? await listFavoriteProducts(user.id) : [];

  return (
    <AccountChrome
      title="Favorilerim"
      subtitle="Beğendiğiniz ürünler."
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: "Favorilerim" },
      ]}
    >
      <FavoritesView initial={items} />
    </AccountChrome>
  );
}
