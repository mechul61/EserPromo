import Image from "next/image";
import Link from "next/link";
import { getSiteSettings, logoSrc } from "@/lib/site-settings";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { width: 130, height: 30 },
  md: { width: 190, height: 44 },
  lg: { width: 250, height: 58 },
};

export async function Logo({ className = "", size = "md" }: LogoProps) {
  const dim = sizes[size];
  const settings = await getSiteSettings();
  const src = logoSrc(settings);

  return (
    <Link
      href="/"
      className={`inline-flex items-center ${className}`}
      aria-label={settings.general.siteName || "eser Promo"}
    >
      <Image
        src={src}
        alt={settings.general.siteName || "eser Promo"}
        width={dim.width}
        height={dim.height}
        priority
        unoptimized
        className="h-auto object-contain"
        style={{ width: dim.width, height: "auto" }}
      />
    </Link>
  );
}
