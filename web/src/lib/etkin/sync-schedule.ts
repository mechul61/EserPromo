import { prisma } from "@/lib/db";

export const SYNC_SCHEDULE_KEY = "sync.schedule";

export type ScheduledJobType = "stock_prices" | "products" | "categories" | "full";

export type SyncSchedule = {
  enabled: boolean;
  /** Dakika cinsinden çalışma aralığı (örn. 60 = her saat). */
  intervalMinutes: number;
  /** Sessiz saat başlangıcı (dahil), Europe/Istanbul. Varsayılan 0 = 00:00. */
  quietStartHour: number;
  /** Sessiz saat bitişi (hariç), Europe/Istanbul. Varsayılan 8 = 08:00'e kadar sessiz. */
  quietEndHour: number;
  jobType: ScheduledJobType;
  lastScheduledAt: string | null;
  lastSkipReason: string | null;
};

export const SYNC_SCHEDULE_DEFAULTS: SyncSchedule = {
  enabled: true,
  intervalMinutes: 60,
  quietStartHour: 0,
  quietEndHour: 8,
  jobType: "stock_prices",
  lastScheduledAt: null,
  lastSkipReason: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clampHour(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(23, Math.max(0, Math.trunc(n)));
}

function clampInterval(n: number) {
  if (!Number.isFinite(n)) return 60;
  return Math.min(24 * 60, Math.max(15, Math.trunc(n)));
}

const JOB_TYPES: ScheduledJobType[] = ["stock_prices", "products", "categories", "full"];

export function mergeSyncSchedule(raw: unknown): SyncSchedule {
  const src = isRecord(raw) ? raw : {};
  const d = SYNC_SCHEDULE_DEFAULTS;
  const job = String(src.jobType ?? d.jobType) as ScheduledJobType;
  return {
    enabled: src.enabled !== false,
    intervalMinutes: clampInterval(Number(src.intervalMinutes ?? d.intervalMinutes)),
    quietStartHour: clampHour(Number(src.quietStartHour ?? d.quietStartHour)),
    quietEndHour: clampHour(Number(src.quietEndHour ?? d.quietEndHour)),
    jobType: JOB_TYPES.includes(job) ? job : d.jobType,
    lastScheduledAt:
      typeof src.lastScheduledAt === "string" && src.lastScheduledAt ? src.lastScheduledAt : null,
    lastSkipReason:
      typeof src.lastSkipReason === "string" && src.lastSkipReason ? src.lastSkipReason : null,
  };
}

export async function getSyncSchedule(): Promise<SyncSchedule> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SYNC_SCHEDULE_KEY } });
  if (!row?.value) return { ...SYNC_SCHEDULE_DEFAULTS };
  try {
    return mergeSyncSchedule(JSON.parse(row.value) as unknown);
  } catch {
    return { ...SYNC_SCHEDULE_DEFAULTS };
  }
}

export async function saveSyncSchedule(input: unknown): Promise<SyncSchedule> {
  const current = await getSyncSchedule();
  const next = mergeSyncSchedule({ ...current, ...(isRecord(input) ? input : {}) });
  await prisma.siteSetting.upsert({
    where: { key: SYNC_SCHEDULE_KEY },
    create: { key: SYNC_SCHEDULE_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

/** Europe/Istanbul saat diliminde 0–23 arası saat. */
export function istanbulHour(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  // en-GB can yield "24" for midnight in some engines
  return hour === 24 ? 0 : clampHour(hour);
}

export function isQuietHour(
  schedule: Pick<SyncSchedule, "quietStartHour" | "quietEndHour">,
  now = new Date(),
): boolean {
  const hour = istanbulHour(now);
  const start = schedule.quietStartHour;
  const end = schedule.quietEndHour;
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function isIntervalDue(
  schedule: Pick<SyncSchedule, "intervalMinutes" | "lastScheduledAt">,
  now = new Date(),
): boolean {
  if (!schedule.lastScheduledAt) return true;
  const last = Date.parse(schedule.lastScheduledAt);
  if (!Number.isFinite(last)) return true;
  return now.getTime() - last >= schedule.intervalMinutes * 60_000;
}

export type ScheduleDecision =
  | { run: true }
  | { run: false; reason: string };

export function decideScheduledRun(schedule: SyncSchedule, now = new Date()): ScheduleDecision {
  if (!schedule.enabled) return { run: false, reason: "Otomatik senkron kapalı" };
  if (isQuietHour(schedule, now)) {
    return {
      run: false,
      reason: `Sessiz saat (${pad(schedule.quietStartHour)}:00–${pad(schedule.quietEndHour)}:00)`,
    };
  }
  if (!isIntervalDue(schedule, now)) {
    return {
      run: false,
      reason: `Aralık dolmadı (her ${schedule.intervalMinutes} dk)`,
    };
  }
  return { run: true };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export async function runScheduledSyncIfDue(options?: { force?: boolean }) {
  const schedule = await getSyncSchedule();
  const decision = options?.force ? ({ run: true } as const) : decideScheduledRun(schedule);

  if (!decision.run) {
    const next = await saveSyncSchedule({
      ...schedule,
      lastSkipReason: decision.reason,
    });
    return { skipped: true as const, reason: decision.reason, schedule: next };
  }

  const already = await prisma.syncRun.findFirst({ where: { status: "running" } });
  if (already) {
    const reason = "Zaten çalışan bir senkron var";
    const next = await saveSyncSchedule({ ...schedule, lastSkipReason: reason });
    return { skipped: true as const, reason, schedule: next };
  }

  const {
    syncFull,
    syncCategories,
    syncAllProducts,
    syncStockPrices,
  } = await import("./sync-jobs");

  let result: Record<string, unknown>;
  switch (schedule.jobType) {
    case "full":
      result = await syncFull();
      break;
    case "categories":
      result = await syncCategories();
      break;
    case "products":
      result = await syncAllProducts();
      break;
    case "stock_prices":
    default:
      result = await syncStockPrices();
      break;
  }

  const next = await saveSyncSchedule({
    ...schedule,
    lastScheduledAt: new Date().toISOString(),
    lastSkipReason: null,
  });

  return { skipped: false as const, schedule: next, result };
}
