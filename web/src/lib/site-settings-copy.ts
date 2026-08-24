import { SITE_CONTACT } from "@/data/catalog-page";
import { phoneDigits } from "@/lib/phone";

export type OutOfStockBehavior = "STOP_SALE" | "CONTINUE_SALE";

export type SiteSettings = {
  general: {
    siteName: string;
    siteTitle: string;
    description: string;
    logoUrl: string;
    faviconUrl: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    /** Sipariş/destek bildirimlerinin gideceği adres. Boşsa email kullanılır. */
    notificationEmail: string;
    address: string;
    googleMapsUrl: string;
  };
  order: {
    orderNumberPrefix: string;
    minimumOrderAmount: number;
    orderNoteEnabled: boolean;
    allowOutOfStockOrder: boolean;
  };
  stock: {
    stockTrackingEnabled: boolean;
    productLimitPriority: boolean;
    lowStockThreshold: number;
    outOfStockBehavior: OutOfStockBehavior;
  };
  shipping: {
    enabled: boolean;
    flatFee: number;
    freeThreshold: number;
  };
  company: {
    companyName: string;
    taxOffice: string;
    taxNumber: string;
    mersisNumber: string;
    address: string;
  };
  socialMedia: {
    instagram: string;
    facebook: string;
    twitter: string;
    linkedin: string;
    youtube: string;
    tiktok: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    allowIndexing: boolean;
  };
  maintenance: {
    enabled: boolean;
    title: string;
    message: string;
  };
};

export const SITE_SETTING_DEFAULTS: SiteSettings = {
  general: {
    siteName: "Eser Promo",
    siteTitle: "Eser Promosyon Ürünleri",
    description: "Kurumsal promosyon ürünleri ve özel baskı çözümleri.",
    logoUrl: "",
    faviconUrl: "",
  },
  contact: {
    phone: SITE_CONTACT.phone,
    whatsapp: SITE_CONTACT.whatsapp,
    email: SITE_CONTACT.email,
    notificationEmail: "",
    address: SITE_CONTACT.address,
    googleMapsUrl: "",
  },
  order: {
    orderNumberPrefix: "ESER",
    minimumOrderAmount: 0,
    orderNoteEnabled: true,
    allowOutOfStockOrder: false,
  },
  stock: {
    stockTrackingEnabled: true,
    productLimitPriority: true,
    lowStockThreshold: 10,
    outOfStockBehavior: "STOP_SALE",
  },
  shipping: {
    enabled: false,
    flatFee: 0,
    freeThreshold: 750,
  },
  company: {
    companyName: "",
    taxOffice: "",
    taxNumber: "",
    mersisNumber: "",
    address: "",
  },
  socialMedia: {
    instagram: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
  },
  seo: {
    title: "Promosyon Ürünleri | Eser Promo — Logolu Kurumsal Hediyelik",
    description:
      "Promosyon ve kurumsal hediye ürünleri: logolu baskı, toplu alım teklifi, hızlı tedarik. Kalem, ajanda, tekstil, termos promosyonları. Türkiye geneli gönderim.",
    keywords:
      "promosyon, promosyon ürünleri, kurumsal hediye, logolu promosyon, promosyon kalem, promosyon ajanda, toplu alım, kurumsal hediyelik, promosyon tekstil, tuzla promosyon, pendik promosyon, gebze promosyon",
    allowIndexing: true,
  },
  maintenance: {
    enabled: false,
    title: "Kısa Bir Ara Verdik",
    message: "Sitemizde kısa süreli bir bakım çalışması gerçekleştiriyoruz. Lütfen daha sonra tekrar deneyin.",
  },
};

export function phoneTelFrom(phone: string) {
  const digits = phoneDigits(phone || SITE_CONTACT.phone);
  if (digits.startsWith("0")) return `tel:+90${digits.slice(1)}`;
  return `tel:+${digits}`;
}

export function whatsappHrefFrom(phone: string) {
  const digits = phoneDigits(phone || SITE_CONTACT.whatsapp);
  const intl = digits.startsWith("0") ? `90${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

export function stockAllowsSale(stock: number, settings: Pick<SiteSettings, "order" | "stock">) {
  if (!settings.stock.stockTrackingEnabled) return true;
  if (stock > 0) return true;
  if (settings.order.allowOutOfStockOrder) return true;
  return settings.stock.outOfStockBehavior === "CONTINUE_SALE";
}

export function stockMaxQty(stock: number, settings: Pick<SiteSettings, "order" | "stock">) {
  if (!stockAllowsSale(stock, settings)) return 0;
  if (!settings.stock.stockTrackingEnabled || settings.order.allowOutOfStockOrder || settings.stock.outOfStockBehavior === "CONTINUE_SALE") {
    return Math.max(stock, 99999);
  }
  return Math.max(0, stock);
}

export function shippingCharge(
  goodsTotal: number,
  settings: Pick<SiteSettings, "shipping">,
) {
  if (!settings.shipping.enabled) return 0;
  const fee = Math.max(0, Number(settings.shipping.flatFee) || 0);
  const threshold = Math.max(0, Number(settings.shipping.freeThreshold) || 0);
  if (fee <= 0) return 0;
  if (threshold > 0 && goodsTotal >= threshold) return 0;
  return fee;
}
