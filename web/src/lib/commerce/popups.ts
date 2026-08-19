import { prisma } from "../db";
import { mediaUrl } from "../media";

export const POPUP_KIND_LABEL = {
  subscribe: "Abonelik",
  promo: "Promosyon",
  info: "Bilgilendirme",
} as const;

export const POPUP_PLACEMENT_LABEL = {
  home: "Ana Sayfa",
  all: "Tüm Sayfalar",
  category: "Kategori",
  product: "Ürün Sayfası",
  cart: "Sepet",
} as const;

export const POPUP_DEVICE_LABEL = {
  all: "Tüm Cihazlar",
  desktop: "Masaüstü",
  mobile: "Mobil",
} as const;

export const POPUP_AUDIENCE_LABEL = {
  all: "Tüm Ziyaretçiler",
  new_visitors: "Yeni Ziyaretçiler",
  returning: "Geri Dönenler",
  logged_in: "Üye Girişi",
} as const;

export const POPUP_STATUS_LABEL = {
  active: "Aktif",
  planned: "Planlanan",
  passive: "Pasif",
  draft: "Taslak",
} as const;

export type PopupKindId = keyof typeof POPUP_KIND_LABEL;
export type PopupPlacementId = keyof typeof POPUP_PLACEMENT_LABEL;
export type PopupDeviceId = keyof typeof POPUP_DEVICE_LABEL;
export type PopupAudienceId = keyof typeof POPUP_AUDIENCE_LABEL;
export type PopupStatusId = keyof typeof POPUP_STATUS_LABEL;

export function popupImageUrl(imagePath: string | null | undefined) {
  if (!imagePath) return "";
  if (imagePath.startsWith("/")) return imagePath;
  return mediaUrl(imagePath) ?? "";
}

export function popupStatus(
  row: { isDraft: boolean; isActive: boolean; startsAt: Date | string | null; endsAt: Date | string | null },
  now = new Date(),
): PopupStatusId {
  if (row.isDraft) return "draft";
  const start = row.startsAt ? new Date(row.startsAt) : null;
  const end = row.endsAt ? new Date(row.endsAt) : null;
  if (row.isActive && start && now < start) return "planned";
  if (!row.isActive) return "passive";
  if (end && now > end) return "passive";
  return "active";
}

export function conversionRate(views: number, conversions: number) {
  if (views <= 0) return 0;
  return (conversions / views) * 100;
}

export function placementMatches(placement: PopupPlacementId, path: string) {
  const clean = path.replace(/\/+$/, "") || "/";
  if (placement === "all") return true;
  if (placement === "home") return clean === "/";
  if (placement === "category") return clean.startsWith("/product-category") || clean.startsWith("/urunler") || clean.startsWith("/arama");
  if (placement === "product") return clean.startsWith("/urun/");
  if (placement === "cart") return clean.startsWith("/sepet");
  return false;
}

const SKIP_PATHS = ["/giris", "/kayit", "/sifremi-unuttum", "/sifre-yenile", "/odeme", "/hesabim", "/admin"];

export function popupPathAllowed(path: string) {
  const clean = path.replace(/\/+$/, "") || "/";
  return !SKIP_PATHS.some((item) => clean === item || clean.startsWith(`${item}/`));
}

export async function getPopupSettings() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ["popupEnabled", "popupDefaultDelay", "popupDefaultFrequency"] } },
  });
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    enabled: map.popupEnabled !== "false",
    defaultDelay: Number(map.popupDefaultDelay || 2) || 2,
    defaultFrequency: Number(map.popupDefaultFrequency || 24) || 24,
  };
}

export async function setPopupSettings(input: { enabled: boolean; defaultDelay: number; defaultFrequency: number }) {
  await Promise.all([
    prisma.siteSetting.upsert({
      where: { key: "popupEnabled" },
      create: { key: "popupEnabled", value: input.enabled ? "true" : "false" },
      update: { value: input.enabled ? "true" : "false" },
    }),
    prisma.siteSetting.upsert({
      where: { key: "popupDefaultDelay" },
      create: { key: "popupDefaultDelay", value: String(input.defaultDelay) },
      update: { value: String(input.defaultDelay) },
    }),
    prisma.siteSetting.upsert({
      where: { key: "popupDefaultFrequency" },
      create: { key: "popupDefaultFrequency", value: String(input.defaultFrequency) },
      update: { value: String(input.defaultFrequency) },
    }),
  ]);
}

export async function getActivePopupForPath(path: string, loggedIn = false) {
  const settings = await getPopupSettings();
  if (!settings.enabled || !popupPathAllowed(path)) return { settings, popup: null };

  const now = new Date();
  const rows = await prisma.popup.findMany({
    where: {
      isDraft: false,
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const ranked = rows
    .filter((row) => placementMatches(row.placement, path))
    .filter((row) => (row.audience === "logged_in" ? loggedIn : true))
    .sort((a, b) => (a.placement === "all" ? 1 : 0) - (b.placement === "all" ? 1 : 0));

  const row = ranked[0];
  if (!row) return { settings, popup: null };

  return {
    settings,
    popup: {
      id: row.id,
      kind: row.kind,
      title: row.title,
      heading: row.heading || row.title,
      body: row.body || row.description,
      ctaLabel: row.ctaLabel || (row.kind === "subscribe" ? "Abone Ol" : "İncele"),
      ctaHref: row.ctaHref || "/urunler",
      couponCode: row.couponCode,
      image: popupImageUrl(row.imagePath),
      device: row.device,
      audience: row.audience,
      delaySeconds: row.delaySeconds || settings.defaultDelay,
      frequencyHours: row.frequencyHours || settings.defaultFrequency,
    },
  };
}
