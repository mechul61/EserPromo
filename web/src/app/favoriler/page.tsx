import { ShopChrome } from "@/components/layout/ShopChrome";

export const metadata = {
  title: "Favorilerim",
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return (
    <ShopChrome>
      <h1 className="text-[24px] font-extrabold text-navy">Favorilerim</h1>
      <p className="mt-4 text-[14px] text-muted">Üye girişi sonrası favori listesi eklenecek.</p>
    </ShopChrome>
  );
}
