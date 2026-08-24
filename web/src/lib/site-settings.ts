import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { SITE_CONTACT } from "@/data/catalog-page";
import {
  SITE_SETTING_DEFAULTS,
  phoneTelFrom,
  whatsappHrefFrom,
  type SiteSettings,
} from "@/lib/site-settings-copy";

export const SITE_SETTINGS_KEY = "site.settings";

export {
  SITE_SETTING_DEFAULTS,
  phoneTelFrom,
  whatsappHrefFrom,
  shippingCharge,
  stockAllowsSale,
  stockMaxQty,
} from "@/lib/site-settings-copy";
export type { SiteSettings, OutOfStockBehavior } from "@/lib/site-settings-copy";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeSettings(raw: unknown): SiteSettings {
  const src = isRecord(raw) ? raw : {};
  const d = SITE_SETTING_DEFAULTS;
  const general = isRecord(src.general) ? src.general : {};
  const contact = isRecord(src.contact) ? src.contact : {};
  const order = isRecord(src.order) ? src.order : {};
  const stock = isRecord(src.stock) ? src.stock : {};
  const shipping = isRecord(src.shipping) ? src.shipping : {};
  const company = isRecord(src.company) ? src.company : {};
  const social = isRecord(src.socialMedia) ? src.socialMedia : {};
  const seo = isRecord(src.seo) ? src.seo : {};
  const maintenance = isRecord(src.maintenance) ? src.maintenance : {};
  return {
    general: {
      siteName: String(general.siteName ?? d.general.siteName),
      siteTitle: String(general.siteTitle ?? d.general.siteTitle),
      description: String(general.description ?? d.general.description),
      logoUrl: String(general.logoUrl ?? ""),
      faviconUrl: String(general.faviconUrl ?? ""),
    },
    contact: {
      phone: String(contact.phone ?? d.contact.phone),
      whatsapp: String(contact.whatsapp ?? d.contact.whatsapp),
      email: String(contact.email ?? d.contact.email),
      notificationEmail: String(contact.notificationEmail ?? "").trim(),
      address: String(contact.address ?? d.contact.address),
      googleMapsUrl: String(contact.googleMapsUrl ?? ""),
    },
    order: {
      orderNumberPrefix: (() => {
        const raw = String(order.orderNumberPrefix ?? d.order.orderNumberPrefix).replace(/-+$/, "");
        if (!raw || raw === "ESR") return "ESER";
        return raw;
      })(),
      minimumOrderAmount: Number(order.minimumOrderAmount ?? 0) || 0,
      orderNoteEnabled: order.orderNoteEnabled !== false,
      allowOutOfStockOrder: order.allowOutOfStockOrder === true,
    },
    stock: {
      stockTrackingEnabled: stock.stockTrackingEnabled !== false,
      productLimitPriority: stock.productLimitPriority !== false,
      lowStockThreshold: Math.max(0, Number(stock.lowStockThreshold ?? 10) || 0),
      outOfStockBehavior: stock.outOfStockBehavior === "CONTINUE_SALE" ? "CONTINUE_SALE" : "STOP_SALE",
    },
    shipping: {
      enabled: shipping.enabled === true,
      flatFee: Math.max(0, Number(shipping.flatFee ?? d.shipping.flatFee) || 0),
      freeThreshold: Math.max(0, Number(shipping.freeThreshold ?? d.shipping.freeThreshold) || 0),
    },
    company: {
      companyName: String(company.companyName ?? ""),
      taxOffice: String(company.taxOffice ?? ""),
      taxNumber: String(company.taxNumber ?? ""),
      mersisNumber: String(company.mersisNumber ?? ""),
      address: String(company.address ?? ""),
    },
    socialMedia: {
      instagram: String(social.instagram ?? ""),
      facebook: String(social.facebook ?? ""),
      twitter: String(social.twitter ?? ""),
      linkedin: String(social.linkedin ?? ""),
      youtube: String(social.youtube ?? ""),
      tiktok: String(social.tiktok ?? ""),
    },
    seo: {
      title: String(seo.title ?? d.seo.title),
      description: String(seo.description ?? d.seo.description),
      keywords: Array.isArray(seo.keywords) ? seo.keywords.join(", ") : String(seo.keywords ?? ""),
      allowIndexing: seo.allowIndexing !== false,
    },
    maintenance: {
      enabled: maintenance.enabled === true,
      title: String(maintenance.title ?? d.maintenance.title),
      message: String(maintenance.message ?? d.maintenance.message),
    },
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SITE_SETTINGS_KEY } });
  if (!row?.value) return SITE_SETTING_DEFAULTS;
  try {
    return mergeSettings(JSON.parse(row.value) as unknown);
  } catch {
    return SITE_SETTING_DEFAULTS;
  }
}

export async function saveSiteSettings(input: unknown) {
  const next = mergeSettings(input);
  await prisma.siteSetting.upsert({
    where: { key: SITE_SETTINGS_KEY },
    create: { key: SITE_SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

export async function getSiteContact() {
  const settings = await getSiteSettings();
  const phone = settings.contact.phone.trim() || SITE_CONTACT.phone;
  const whatsapp = settings.contact.whatsapp.trim() || SITE_CONTACT.whatsapp;
  const email = settings.contact.email.trim() || SITE_CONTACT.email;
  const notificationEmail =
    settings.contact.notificationEmail.trim() || email || SITE_CONTACT.email;
  const address = settings.contact.address.trim() || SITE_CONTACT.address;
  return {
    phone,
    phoneTel: phoneTelFrom(phone),
    whatsapp,
    whatsappHref: whatsappHrefFrom(whatsapp),
    email,
    notificationEmail,
    address,
    mapsUrl: settings.contact.googleMapsUrl.trim(),
  };
}

export function logoSrc(settings: SiteSettings) {
  return mediaUrl(settings.general.logoUrl) || "/brand/logo.png?v=2";
}

export function faviconSrc(settings: SiteSettings) {
  return mediaUrl(settings.general.faviconUrl);
}
