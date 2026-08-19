export const CARGO_COMPANIES = {
  mng: "MNG Kargo",
  yurtici: "Yurtiçi Kargo",
  aras: "Aras Kargo",
  ptt: "PTT Kargo",
  surat: "Sürat Kargo",
} as const;

export type CargoCompanyId = keyof typeof CARGO_COMPANIES;
export type CargoTabId = "waiting" | "shipped" | "delivered" | "returned";

export const CARGO_TAB_LABEL: Record<CargoTabId, string> = {
  waiting: "Kargo Bekleyen",
  shipped: "Kargoya Verilen",
  delivered: "Teslim Edilen",
  returned: "İade Edilen",
};

export const CARGO_STATUS_LABEL: Record<CargoTabId, string> = {
  waiting: "Kargo Bekliyor",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
  returned: "İade Edildi",
};

export function isCargoCompany(value: string): value is CargoCompanyId {
  return value in CARGO_COMPANIES;
}

export function cargoTabForStatus(status: string): CargoTabId | null {
  if (status === "paid" || status === "preparing") return "waiting";
  if (status === "shipped") return "shipped";
  if (status === "completed") return "delivered";
  if (status === "cancelled") return "returned";
  return null;
}

export function cargoTrackingUrl(company: string, trackingNo: string, customUrl = "") {
  if (customUrl.trim()) return customUrl.trim();
  const no = trackingNo.trim();
  if (!no) return "";
  if (company === "mng") return `https://www.mngkargo.com.tr/gonderi-takip?kod=${encodeURIComponent(no)}`;
  if (company === "yurtici") return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(no)}`;
  if (company === "aras") return `https://kargotakip.araskargo.com.tr/?code=${encodeURIComponent(no)}`;
  if (company === "ptt") return `https://gonderitakip.ptt.gov.tr/`;
  if (company === "surat") return `https://www.suratkargo.com.tr/KargoTakip/?kargotakipno=${encodeURIComponent(no)}`;
  return "";
}
