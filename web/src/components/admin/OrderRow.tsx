"use client";

import { useRouter } from "next/navigation";

export function OrderRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <tr
      role="link"
      tabIndex={0}
      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-soft"
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </tr>
  );
}
