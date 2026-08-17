import { AccountChrome } from "@/components/account/AccountChrome";

export function AccountPlaceholder({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <AccountChrome
      title={title}
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: title },
      ]}
    >
      <div className="rounded-md border border-line bg-white p-6 text-[14px] leading-relaxed text-[#555]">
        {text}
      </div>
    </AccountChrome>
  );
}
