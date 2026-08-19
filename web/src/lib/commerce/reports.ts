import { prisma } from "@/lib/db";
import { formatPriceTry } from "@/lib/media";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/commerce/orders";
import { CARGO_COMPANIES, type CargoCompanyId } from "@/lib/commerce/cargo";
import { REVENUE_STATUSES, moneyNum } from "@/lib/commerce/revenue";
import {
  REPORT_SOURCES,
  type ReportCategoryId,
  type ReportKindId,
  type ReportScheduleId,
  type ReportSourceId,
} from "@/lib/commerce/reports-copy";

export {
  REPORT_CATEGORY_LABEL,
  REPORT_KIND_LABEL,
  REPORT_SCHEDULE_LABEL,
  REPORT_SOURCES,
} from "@/lib/commerce/reports-copy";
export type { ReportCategoryId, ReportKindId, ReportScheduleId, ReportSourceId } from "@/lib/commerce/reports-copy";

export type ReportTable = {
  headers: string[];
  rows: Array<Array<string | number>>;
};

const EXPORT_LIMIT = 5000;

const DEFAULTS: Array<{
  key: string;
  source: ReportSourceId;
  name: string;
  description: string;
  category: ReportCategoryId;
  kind: ReportKindId;
  icon: string;
  isShared: boolean;
  schedule: ReportScheduleId;
}> = (Object.entries(REPORT_SOURCES) as Array<[ReportSourceId, (typeof REPORT_SOURCES)[ReportSourceId]]>).map(
  ([source, meta]) => ({
    key: source,
    source,
    name: meta.name,
    description: meta.description,
    category: meta.category,
    kind: meta.kind,
    icon: meta.icon,
    isShared: true,
    schedule: "none" as const,
  }),
);

function money(value: unknown) {
  return formatPriceTry(moneyNum(value as { toString(): string }));
}

function cargoName(id: string) {
  return id in CARGO_COMPANIES ? CARGO_COMPANIES[id as CargoCompanyId] : id || "—";
}

export async function ensureSavedReports() {
  await Promise.all(
    DEFAULTS.map((item) =>
      prisma.savedReport.upsert({
        where: { key: item.key },
        create: { ...item, isSystem: true, creatorName: "Yönetici" },
        update: {},
      }),
    ),
  );
}

export async function buildReportTable(source: string): Promise<ReportTable> {
  if (source === "orders") {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: EXPORT_LIMIT,
      include: { user: { select: { name: true, email: true } }, payments: { take: 1, orderBy: { createdAt: "desc" } } },
    });
    return {
      headers: ["siparisNo", "musteri", "email", "durum", "odeme", "tutar", "sehir", "tarih"],
      rows: orders.map((row) => [
        row.publicNumber,
        row.user.name,
        row.user.email,
        ORDER_STATUS_LABEL[row.status] ?? row.status,
        row.payments[0]?.provider === "transfer" ? "Havale / EFT" : "Kredi kartı",
        money(row.grandTotal),
        `${row.shipDistrict} / ${row.shipCity}`,
        row.createdAt.toISOString(),
      ]),
    };
  }

  if (source === "revenue") {
    const orders = await prisma.order.findMany({
      where: { status: { in: [...REVENUE_STATUSES] } },
      orderBy: { createdAt: "desc" },
      take: EXPORT_LIMIT,
      include: { user: { select: { name: true, email: true } } },
    });
    return {
      headers: ["siparisNo", "musteri", "email", "net", "kdv", "genelToplam", "odemeTarihi"],
      rows: orders.map((row) => [
        row.publicNumber,
        row.user.name,
        row.user.email,
        money(row.subtotal),
        money(row.vatTotal),
        money(row.grandTotal),
        row.paidAt?.toISOString() ?? "",
      ]),
    };
  }

  if (source === "customers") {
    const users = await prisma.user.findMany({
      where: { role: "customer" },
      orderBy: { createdAt: "desc" },
      take: EXPORT_LIMIT,
      include: { _count: { select: { orders: true } } },
    });
    return {
      headers: ["musteriNo", "ad", "email", "telefon", "sehir", "grup", "siparis", "durum", "kayit"],
      rows: users.map((row) => [
        row.publicNo,
        row.name,
        row.email,
        row.phone ?? "",
        row.city,
        row.customerGroup,
        row._count.orders,
        row.isActive && !row.blocked ? "Aktif" : "Pasif",
        row.createdAt.toISOString(),
      ]),
    };
  }

  if (source === "products") {
    const items = await prisma.orderItem.findMany({
      where: { order: { status: { in: [...REVENUE_STATUSES] } } },
      take: 20000,
      select: { productId: true, sku: true, name: true, quantity: true, lineTotal: true },
    });
    const map = new Map<number, { sku: string; name: string; qty: number; total: number }>();
    for (const item of items) {
      const cur = map.get(item.productId) ?? { sku: item.sku, name: item.name, qty: 0, total: 0 };
      cur.qty += item.quantity;
      cur.total += moneyNum(item.lineTotal);
      map.set(item.productId, cur);
    }
    const ranked = [...map.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, EXPORT_LIMIT);
    return {
      headers: ["urunId", "sku", "ad", "adet", "tutar"],
      rows: ranked.map(([id, row]) => [id, row.sku, row.name, row.qty, money(row.total)]),
    };
  }

  if (source === "categories") {
    const items = await prisma.orderItem.findMany({
      where: { order: { status: { in: [...REVENUE_STATUSES] } } },
      take: 20000,
      select: { quantity: true, lineTotal: true, product: { select: { category: { select: { name: true } } } } },
    });
    const map = new Map<string, { qty: number; total: number }>();
    for (const item of items) {
      const name = item.product.category.name;
      const cur = map.get(name) ?? { qty: 0, total: 0 };
      cur.qty += item.quantity;
      cur.total += moneyNum(item.lineTotal);
      map.set(name, cur);
    }
    return {
      headers: ["kategori", "adet", "tutar"],
      rows: [...map.entries()]
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, row]) => [name, row.qty, money(row.total)]),
    };
  }

  if (source === "payments") {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: EXPORT_LIMIT,
      include: { order: { select: { publicNumber: true } } },
    });
    return {
      headers: ["siparisNo", "saglayici", "durum", "tutar", "tarih"],
      rows: payments.map((row) => [
        row.order.publicNumber,
        row.provider === "transfer" ? "Havale / EFT" : "iyzico",
        PAYMENT_STATUS_LABEL[row.status] ?? row.status,
        money(row.amount),
        row.createdAt.toISOString(),
      ]),
    };
  }

  if (source === "coupons") {
    const coupons = await prisma.coupon.findMany({
      orderBy: { usedCount: "desc" },
      take: EXPORT_LIMIT,
      include: { _count: { select: { redemptions: true } } },
    });
    return {
      headers: ["kod", "ad", "kullanim", "limit", "indirim", "baslangic", "bitis", "aktif"],
      rows: coupons.map((row) => [
        row.code,
        row.name,
        row._count.redemptions,
        row.usageLimit ?? "∞",
        `${row.discountKind === "percent" ? "%" : "₺"}${moneyNum(row.discountValue)}`,
        row.startsAt.toISOString(),
        row.endsAt.toISOString(),
        row.isActive ? "Evet" : "Hayır",
      ]),
    };
  }

  if (source === "cargo") {
    const orders = await prisma.order.findMany({
      where: { status: { in: ["paid", "preparing", "shipped", "completed"] } },
      orderBy: { createdAt: "desc" },
      take: EXPORT_LIMIT,
      include: { user: { select: { name: true } } },
    });
    return {
      headers: ["siparisNo", "musteri", "durum", "firma", "takipNo", "takipUrl", "sehir"],
      rows: orders.map((row) => [
        row.publicNumber,
        row.user.name,
        ORDER_STATUS_LABEL[row.status] ?? row.status,
        cargoName(row.cargoCompany),
        row.trackingNo,
        row.trackingUrl,
        `${row.shipDistrict} / ${row.shipCity}`,
      ]),
    };
  }

  if (source === "carts") {
    const carts = await prisma.cart.findMany({
      where: { items: { some: {} } },
      orderBy: { updatedAt: "desc" },
      take: EXPORT_LIMIT,
      include: {
        user: { select: { name: true, email: true } },
        items: { select: { quantity: true, product: { select: { price: true, vatRate: true } } } },
      },
    });
    return {
      headers: ["musteri", "email", "kalem", "adet", "guncelleme"],
      rows: carts.map((row) => [
        row.user?.name ?? "Misafir",
        row.user?.email ?? "",
        row.items.length,
        row.items.reduce((sum, item) => sum + item.quantity, 0),
        row.updatedAt.toISOString(),
      ]),
    };
  }

  return { headers: ["bilgi"], rows: [["Bu rapor kaynağı tanımlı değil"]] };
}

export function toCsv(table: ReportTable) {
  const escape = (value: string | number) => {
    const text = String(value);
    if (/[",\n;]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  return `\uFEFF${[table.headers.map(escape).join(";"), ...table.rows.map((row) => row.map(escape).join(";"))].join("\n")}`;
}

export async function logReportRun(reportId: string, action: string, rowCount: number) {
  await prisma.$transaction([
    prisma.reportRun.create({ data: { reportId, action, rowCount } }),
    prisma.savedReport.update({
      where: { id: reportId },
      data: { runCount: { increment: 1 }, lastRunAt: new Date() },
    }),
  ]);
}

export function isDue(schedule: ReportScheduleId, lastRunAt: Date | null, now = new Date()) {
  if (schedule === "none") return false;
  if (!lastRunAt) return true;
  const ms = now.getTime() - lastRunAt.getTime();
  if (schedule === "daily") return ms >= 24 * 60 * 60 * 1000;
  if (schedule === "weekly") return ms >= 7 * 24 * 60 * 60 * 1000;
  return ms >= 30 * 24 * 60 * 60 * 1000;
}

export async function runDueScheduledReports() {
  const rows = await prisma.savedReport.findMany({ where: { schedule: { not: "none" } } });
  for (const row of rows) {
    if (!isDue(row.schedule, row.lastRunAt)) continue;
    const table = await buildReportTable(row.source);
    await logReportRun(row.id, "scheduled", table.rows.length);
  }
}
