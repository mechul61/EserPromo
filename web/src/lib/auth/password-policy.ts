export const PASSWORD_RULES = [
  { id: "len", label: "En az 8 karakter", test: (value: string) => value.length >= 8 },
  { id: "upper", label: "En az bir büyük harf (A–Z)", test: (value: string) => /[A-ZÇĞİÖŞÜ]/.test(value) },
  { id: "lower", label: "En az bir küçük harf (a–z)", test: (value: string) => /[a-zçğıöşü]/.test(value) },
  { id: "digit", label: "En az bir rakam (0–9)", test: (value: string) => /\d/.test(value) },
  {
    id: "symbol",
    label: "En az bir sembol (! @ # $ % & * gibi)",
    test: (value: string) => /[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(value),
  },
] as const;

export function passwordPolicyError(plain: string): string | null {
  const failed = PASSWORD_RULES.find((rule) => !rule.test(plain));
  return failed ? `Şifre kuralı: ${failed.label}.` : null;
}
