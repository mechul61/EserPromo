import Link from "next/link";
import { Check, ChevronRight, Mail, MapPin, Menu, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { SITE_CONTACT } from "@/data/catalog-page";
import { getCategoryTree } from "@/lib/catalog";
import { categoryPath } from "@/lib/seo/urls";

export async function CatalogSidebar({
  activeSlug = "",
  heading = "KATEGORİLER",
  showPromo = true,
}: {
  activeSlug?: string;
  heading?: string;
  showPromo?: boolean;
}) {
  const tree = await getCategoryTree();

  return (
    <aside id="katalog-kategoriler" className="w-full shrink-0 scroll-mt-24 lg:w-[270px]">
      <div className="overflow-hidden rounded-md border border-line bg-white shadow-md">
        <div
          className="flex h-12 items-center gap-2.5 bg-navy px-4 text-[13px] font-bold tracking-wide text-white"
          style={{ color: "#ffffff" }}
        >
          <Menu className="size-5 shrink-0" strokeWidth={2.5} color="#ffffff" />
          {heading}
        </div>
        <ul>
          {tree.map((cat) => {
            const childActive = cat.children.some((child) => child.slug === activeSlug);
            const isActive = activeSlug === cat.slug || childActive;
            return (
              <li key={cat.slug} className="border-b border-[#f0f1f3] last:border-b-0">
                <Link
                  href={categoryPath(cat.slug)}
                  className={`flex items-center gap-2.5 px-3 py-[9px] text-[13px] ${
                    isActive ? "font-bold text-brand-red" : "font-medium text-[#222] hover:bg-[#fafafa]"
                  }`}
                >
                  <span className="min-w-0 flex-1">{cat.name}</span>
                  {cat.children.length > 0 ? (
                    <ChevronRight
                      className={`size-3.5 text-[#c8c8c8] transition ${isActive ? "rotate-90" : ""}`}
                    />
                  ) : null}
                </Link>
                {isActive && cat.children.length > 0 ? (
                  <ul className="border-t border-[#f0f1f3] bg-[#fafbfc] pb-1">
                    {cat.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={categoryPath(child.slug)}
                          className={`flex items-center px-3 py-[7px] pl-7 text-[12.5px] leading-snug ${
                            activeSlug === child.slug
                              ? "font-bold text-brand-red"
                              : "text-[#555] hover:bg-[#f3f4f6]"
                          }`}
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 overflow-hidden rounded-sm bg-navy text-white">
        <h3
          className="px-4 pt-4 text-[13px] font-extrabold tracking-wide"
          style={{ color: "#ffffff" }}
        >
          BİZE ULAŞIN
        </h3>
        <ul className="space-y-2.5 px-4 pt-3 pb-4 text-[12.5px]">
          <li className="flex items-start gap-2.5">
            <Phone className="mt-0.5 size-4 shrink-0 text-[#25D366]" />
            <span>
              {SITE_CONTACT.phone}
              <br />
              {SITE_CONTACT.whatsapp}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <Mail className="mt-0.5 size-4 shrink-0 text-[#25D366]" />
            {SITE_CONTACT.email}
          </li>
          <li className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-4 shrink-0 text-white" />
            {SITE_CONTACT.address}
          </li>
        </ul>
        <div className="flex items-center justify-center gap-2.5 px-4 pb-4">
          <a href="#" aria-label="Facebook" className="flex size-8 items-center justify-center rounded-full bg-[#1877F2] text-white">
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v8h4v-8h3.2l.8-4H13V9c0-.6.4-1 1-1Z" />
            </svg>
          </a>
          <a href="#" aria-label="Instagram" className="flex size-8 items-center justify-center rounded-full bg-[#E4405F] text-white">
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 2A1.8 1.8 0 1 0 13.8 12 1.8 1.8 0 0 0 12 10.2ZM17.2 7.1a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9Z" />
            </svg>
          </a>
          <a
            href={SITE_CONTACT.whatsappHref}
            aria-label="WhatsApp"
            className="flex size-8 items-center justify-center rounded-full bg-[#25D366] text-white"
          >
            <WhatsAppIcon className="size-4" />
          </a>
        </div>
      </div>

      {showPromo ? (
      <div className="mt-4 overflow-hidden rounded-sm border border-[#e4e6ea] bg-white">
        <div className="bg-[#f7f8fa] px-3 py-2.5 text-center text-[12px] leading-tight font-extrabold tracking-wide text-navy">
          KURUMSAL AJANDA VE DEFTERLER
          <br />
          / LOGO BASKILI
        </div>
        <ul className="space-y-1 px-4 pt-3 text-[12px] text-[#333]">
          {["Özel Tasarım", "Kaliteli Baskı", "Uygun Fiyat"].map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <Check className="size-3.5 text-brand-red" strokeWidth={3} />
              {item}
            </li>
          ))}
        </ul>
        <div className="px-4 pt-3 pb-4">
          <a
            href={SITE_CONTACT.whatsappHref}
            className="flex h-9 items-center justify-center rounded-sm bg-brand-red text-[12px] font-extrabold tracking-wide text-white"
            style={{ color: "#ffffff" }}
          >
            TEKLİF AL
          </a>
        </div>
      </div>
      ) : null}
    </aside>
  );
}
