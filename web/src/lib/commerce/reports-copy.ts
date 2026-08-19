export const REPORT_CATEGORY_LABEL = {
  sales: "Satış",
  customer: "Müşteri",
  product: "Ürün",
  finance: "Finans",
  marketing: "Pazarlama",
  other: "Diğer",
} as const;

export const REPORT_KIND_LABEL = {
  table: "Tablo",
  chart: "Grafik",
} as const;

export const REPORT_SCHEDULE_LABEL = {
  none: "Zamanlama yok",
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
} as const;

export type ReportCategoryId = keyof typeof REPORT_CATEGORY_LABEL;
export type ReportKindId = keyof typeof REPORT_KIND_LABEL;
export type ReportScheduleId = keyof typeof REPORT_SCHEDULE_LABEL;

export const REPORT_SOURCES = {
  orders: {
    name: "Sipariş Özeti",
    description: "Siparişlerin genel özetini gösterir.",
    category: "sales" as const,
    kind: "table" as const,
    icon: "cart",
  },
  revenue: {
    name: "Ciro Raporu",
    description: "Tahsil edilen siparişleri ve KDV kırılımını listeler.",
    category: "finance" as const,
    kind: "table" as const,
    icon: "wallet",
  },
  customers: {
    name: "Müşteri Analizi",
    description: "Kayıtlı müşterileri grup, şehir ve sipariş adedine göre gösterir.",
    category: "customer" as const,
    kind: "chart" as const,
    icon: "users",
  },
  products: {
    name: "Ürün Performansı",
    description: "Satılan ürün adedi ve tutarını listeler.",
    category: "product" as const,
    kind: "table" as const,
    icon: "box",
  },
  categories: {
    name: "Kategori Satışları",
    description: "Kategorilere göre tahsil edilen satışı özetler.",
    category: "sales" as const,
    kind: "chart" as const,
    icon: "tag",
  },
  payments: {
    name: "Ödeme Raporu",
    description: "Kart ve havale ödemelerinin durumunu gösterir.",
    category: "finance" as const,
    kind: "table" as const,
    icon: "card",
  },
  coupons: {
    name: "Pazarlama Kampanyaları",
    description: "Kupon kullanım adedi ve indirim tutarını listeler.",
    category: "marketing" as const,
    kind: "table" as const,
    icon: "ticket",
  },
  cargo: {
    name: "Kargo Durumu",
    description: "Kargoya verilen siparişleri takip bilgisiyle listeler.",
    category: "other" as const,
    kind: "table" as const,
    icon: "truck",
  },
  carts: {
    name: "Sepet Terk",
    description: "İçinde ürün kalan sepetleri gösterir.",
    category: "marketing" as const,
    kind: "table" as const,
    icon: "bag",
  },
} as const;

export type ReportSourceId = keyof typeof REPORT_SOURCES;
