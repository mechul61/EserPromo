export const REVENUE_STATUSES = ["paid", "preparing", "shipped", "completed"] as const;
export const PENDING_STATUSES = ["pending_payment"] as const;
export const LOST_STATUSES = ["cancelled", "failed"] as const;

export type RevenuePeriod = "today" | "week" | "month" | "year" | "all";

export const REVENUE_PERIODS: Array<{ id: RevenuePeriod; label: string }> = [
  { id: "today", label: "Bugün" },
  { id: "week", label: "Bu hafta" },
  { id: "month", label: "Bu ay" },
  { id: "year", label: "Bu yıl" },
  { id: "all", label: "Tümü" },
];

export function parseRevenuePeriod(raw?: string): RevenuePeriod {
  if (raw === "today" || raw === "week" || raw === "month" || raw === "year" || raw === "all") {
    return raw;
  }
  return "month";
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function istanbulYmd(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function atIstanbul(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, -3, 0, 0, 0));
}

function addDays(ymd: string, days: number) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function isoWeekday(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function revenueCreatedAtFilter(period: RevenuePeriod): { gte?: Date; lt?: Date } {
  if (period === "all") return {};
  const today = istanbulYmd();
  const [y, m] = today.split("-").map(Number);
  const tomorrow = addDays(today, 1);

  if (period === "today") {
    return { gte: atIstanbul(today), lt: atIstanbul(tomorrow) };
  }
  if (period === "week") {
    const monday = addDays(today, -(isoWeekday(today) - 1));
    return { gte: atIstanbul(monday), lt: atIstanbul(tomorrow) };
  }
  if (period === "month") {
    return { gte: atIstanbul(`${y}-${pad(m)}-01`), lt: atIstanbul(tomorrow) };
  }
  return { gte: atIstanbul(`${y}-01-01`), lt: atIstanbul(tomorrow) };
}

export function lastMonthStarts(count: number) {
  const today = istanbulYmd();
  const [y, m] = today.split("-").map(Number);
  const months: Array<{ key: string; label: string; gte: Date; lt: Date }> = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const dt = new Date(Date.UTC(y, m - 1 - i, 1));
    const yy = dt.getUTCFullYear();
    const mm = dt.getUTCMonth() + 1;
    const next = new Date(Date.UTC(yy, mm, 1));
    const key = `${yy}-${pad(mm)}`;
    months.push({
      key,
      label: dt.toLocaleDateString("tr-TR", { month: "long", year: "numeric", timeZone: "UTC" }),
      gte: atIstanbul(`${yy}-${pad(mm)}-01`),
      lt: atIstanbul(`${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-01`),
    });
  }
  return months;
}

export function monthKeyIstanbul(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

export function moneyNum(value: { toString(): string } | number | null | undefined) {
  return Number(value ?? 0);
}
