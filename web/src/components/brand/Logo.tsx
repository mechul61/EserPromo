import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { width: 130, height: 30 },
  md: { width: 190, height: 44 },
  lg: { width: 250, height: 58 },
};

export function Logo({ className = "", size = "md" }: LogoProps) {
  const dim = sizes[size];

  return (
    <Link
      href="/"
      className={`inline-flex items-center ${className}`}
      aria-label="eser Promo"
    >
      <Image
        src="/brand/logo.png?v=2"
        alt="eser Promo"
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
