import { Check } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/auth/password-policy";

export function PasswordRules({ value }: { value: string }) {
  return (
    <ul className="mt-3 space-y-1.5 rounded-md border border-[#d7e8f6] bg-white px-3 py-2.5">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-2 text-[12px] ${ok ? "font-semibold text-brand-green" : "text-[#555]"}`}
          >
            <Check className={`size-3.5 shrink-0 ${ok ? "text-brand-green" : "text-[#c5c9ce]"}`} strokeWidth={3} />
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
