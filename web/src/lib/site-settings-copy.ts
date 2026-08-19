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
    title: "Eser Promo | Promosyon Ürünleri",
    description: "Logo baskılı promosyon ürünleri, kurumsal hediyelik ve toplu alım çözümleri.",
    keywords: "",
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
