export const SUPPORT_CATEGORY_LABEL = {
  order: "Sipariş",
  returns: "İade",
  payment: "Ödeme",
  invoice: "Fatura",
  cargo: "Kargo",
  account: "Hesap",
  other: "Diğer",
} as const;

export const SUPPORT_PRIORITY_LABEL = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
} as const;

export const SUPPORT_STATUS_LABEL = {
  open: "Açık",
  waiting: "Yanıt Bekliyor",
  resolved: "Çözüldü",
  archived: "Arşiv",
} as const;

export type SupportCategoryId = keyof typeof SUPPORT_CATEGORY_LABEL;
export type SupportPriorityId = keyof typeof SUPPORT_PRIORITY_LABEL;
export type SupportStatusId = keyof typeof SUPPORT_STATUS_LABEL;
