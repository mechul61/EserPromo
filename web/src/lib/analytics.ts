import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

export function analyticsDayKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function visitorKey(day: string, visitorId: string) {
  return createHash("sha256").update(`${day}:${visitorId}`).digest("hex").slice(0, 40);
}

export async function recordPageView(visitorId: string) {
  const vid = visitorId.trim().slice(0, 80);
  if (!vid) return;
  const day = analyticsDayKey();
  const id = visitorKey(day, vid);

  await prisma.$transaction(async (tx) => {
    await tx.siteAnalyticsDay.upsert({
      where: { day },
      create: { day, pageViews: 1, visitors: 0 },
      update: { pageViews: { increment: 1 } },
    });

    try {
      await tx.siteVisitorDay.create({ data: { id, day } });
      await tx.siteAnalyticsDay.update({
        where: { day },
        data: { visitors: { increment: 1 } },
      });
    } catch {
      // Aynı ziyaretçi aynı gün tekrar sayılmaz
    }
  });
}

export async function sumAnalyticsRange(fromDay: string, toDayExclusive: string) {
  const rows = await prisma.siteAnalyticsDay.findMany({
    where: { day: { gte: fromDay, lt: toDayExclusive } },
  });
  return rows.reduce(
    (acc, row) => {
      acc.pageViews += row.pageViews;
      acc.visitors += row.visitors;
      return acc;
    },
    { pageViews: 0, visitors: 0 },
  );
}

export async function listAnalyticsDays(fromDay: string, toDayExclusive: string) {
  return prisma.siteAnalyticsDay.findMany({
    where: { day: { gte: fromDay, lt: toDayExclusive } },
    orderBy: { day: "asc" },
  });
}
