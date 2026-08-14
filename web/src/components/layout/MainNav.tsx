import Link from "next/link";
import { ChevronDown, ClipboardPen, Menu, Stamp } from "lucide-react";

const links = [
  { href: "/", label: "ANA SAYFA", active: true },
  { href: "/hakkimizda", label: "HAKKIMIZDA" },
  { href: "/kurumsal", label: "KURUMSAL", hasDropdown: true },
  { href: "/baski-teknikleri", label: "BASKI TEKNİKLERİ" },
  { href: "/blog", label: "BLOG" },
  { href: "/iletisim", label: "İLETİŞİM" },
];

/** Yatay menü + CTA — KATEGORİLER sol sidebar’da (tek parça) */
export function MainNav() {
  return (
    <nav className="border-b border-line bg-white">
      <div className="flex h-12 items-center justify-between gap-3">
        <ul className="flex items-center gap-0.5 overflow-x-auto text-[13px] font-bold tracking-wide text-navy">
          <li className="lg:hidden">
            <a
              href="#kategoriler"
              className="mr-2 inline-flex items-center gap-1.5 rounded bg-navy px-3 py-2 text-[11px] font-bold text-white"
              style={{ color: "#ffffff" }}
            >
              <Menu className="size-4" color="#ffffff" />
              KATEGORİLER
            </a>
          </li>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`inline-flex h-12 items-center gap-1 whitespace-nowrap px-2.5 xl:px-3.5 ${
                  link.active
                    ? "border-b-[3px] border-brand-red text-brand-red"
                    : "border-b-[3px] border-transparent hover:text-brand-red"
                }`}
              >
                {link.label}
                {link.hasDropdown ? <ChevronDown className="size-3.5 opacity-80" /> : null}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Link
            href="/teklif"
            className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-[11px] font-bold tracking-wide text-white hover:bg-navy-deep"
            style={{ color: "#ffffff" }}
          >
            <ClipboardPen className="size-3.5" color="#ffffff" />
            TOPLU ALIM / TEKLİF FORMU
          </Link>
          <Link
            href="/logolu-siparis"
            className="inline-flex items-center gap-1.5 rounded-md bg-orange px-3 py-2 text-[11px] font-bold tracking-wide text-navy hover:bg-orange-hover"
          >
            <span className="flex size-4 items-center justify-center rounded-[3px] bg-brand-red text-[9px] text-white">
              <Stamp className="size-2.5" />
            </span>
            LOGOLU SİPARİŞ
          </Link>
        </div>
      </div>
    </nav>
  );
}
