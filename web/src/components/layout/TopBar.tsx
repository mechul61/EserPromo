import { Check } from "lucide-react";

const benefits = [
  "Kurumsal Çözümler",
  "Hızlı Teklif",
  "Logo Baskılı Üretim",
  "Türkiye Geneli Teslimat",
];

const socials = [
  {
    name: "Instagram",
    href: "#",
    src: "/brand/social-instagram.svg",
  },
  {
    name: "Facebook",
    href: "#",
    src: "/brand/social-facebook.svg",
  },
  {
    name: "LinkedIn",
    href: "#",
    src: "/brand/social-linkedin.svg",
  },
  {
    name: "YouTube",
    href: "#",
    src: "/brand/social-youtube.svg",
  },
] as const;

export function TopBar() {
  return (
    <div className="bg-navy text-[12px] text-white">
      <div className="container-ep flex h-9 items-center justify-between gap-4">
        <p className="flex items-center gap-2.5 whitespace-nowrap font-semibold tracking-wide">
          <span>Promosyon Ürünlerinde Doğru Adres!</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/slogan-heart.png?v=4"
            alt=""
            width={30}
            height={25}
            className="h-[17px] w-auto shrink-0"
            aria-hidden
          />
        </p>

        <ul className="mx-auto hidden items-center gap-5 lg:flex">
          {benefits.map((item) => (
            <li key={item} className="flex items-center gap-1.5 whitespace-nowrap">
              <Check className="size-3.5 text-emerald-400" strokeWidth={3} />
              {item}
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5">
          {socials.map((social) => (
            <a
              key={social.name}
              href={social.href}
              aria-label={social.name}
              className="inline-flex transition hover:scale-105"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={social.src}
                alt=""
                width={20}
                height={20}
                className="size-5"
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
