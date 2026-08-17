import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { FOOTER_COLS, SHOP_SITEMAP } from "@/data/info-pages";
import { getCategoryTree } from "@/lib/catalog";
import { categoryPath } from "@/lib/seo/urls";

export const metadata = { title: "Site Haritası" };

function MapGroup({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-5">
      <h2 className="text-[14px] font-extrabold tracking-wide text-navy uppercase">{title}</h2>
      <ul className="mt-3 columns-1 gap-x-8 space-y-1.5 text-[13px] sm:columns-2">
        {links.map((item) => (
          <li key={item.href} className="break-inside-avoid">
            <Link href={item.href} className="text-[#444] hover:text-navy">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function Page() {
  const tree = await getCategoryTree();
  const categories = tree.map((cat) => ({ href: categoryPath(cat.slug), label: cat.name }));

  return (
    <ShopChrome>
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
        <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
          <Home className="size-3.5" />
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/" className="hover:text-navy">
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-[#555]">Site Haritası</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-[24px] font-extrabold tracking-wide text-navy uppercase">Site Haritası</h1>
        <p className="mt-2 mb-6 text-[14px] text-[#555]">Sitedeki başlıca sayfalar ve kategori listesi.</p>
        <div className="space-y-4">
          <MapGroup title="Alışveriş" links={[...SHOP_SITEMAP]} />
          <MapGroup title="Kurumsal" links={[...FOOTER_COLS.kurumsal]} />
          <MapGroup title="Müşteri Hizmetleri" links={[...FOOTER_COLS.hizmetler]} />
          <MapGroup title="Bilgilendirme" links={[...FOOTER_COLS.bilgilendirme]} />
          {categories.length > 0 ? <MapGroup title="Kategoriler" links={categories} /> : null}
        </div>
      </div>
    </ShopChrome>
  );
}
