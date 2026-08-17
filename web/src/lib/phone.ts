export function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length >= 12) digits = digits.slice(2);
  if (digits.length === 10 && (digits.startsWith("5") || digits.startsWith("2"))) {
    digits = `0${digits}`;
  }
  return digits.slice(0, 11);
}

export function formatPhoneTR(value: string) {
  const digits = phoneDigits(value);
  if (!digits) return "";
  if (digits.startsWith("05")) {
    const rest = digits.slice(1);
    const a = rest.slice(0, 3);
    const b = rest.slice(3, 6);
    const c = rest.slice(6, 8);
    const d = rest.slice(8, 10);
    let out = `0 (${a}`;
    if (a.length === 3) out += ")";
    if (b) out += ` ${b}`;
    if (c) out += ` ${c}`;
    if (d) out += ` ${d}`;
    return out;
  }
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 9), digits.slice(9, 11)]
    .filter(Boolean)
    .join(" ");
}

export function isValidTRPhone(value: string) {
  const digits = phoneDigits(value);
  return digits.length === 11 && digits.startsWith("0");
}
