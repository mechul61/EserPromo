export const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: "Taslak",
  pending_payment: "Ödeme bekleniyor",
  paid: "Sipariş alındı",
  preparing: "Kargo hazırlanıyor",
  shipped: "Kargoya verildi",
  completed: "Teslim edildi",
  cancelled: "İptal",
  failed: "Başarısız",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Ödeme bekleniyor",
  success: "Ödeme alındı",
  failure: "Ödeme başarısız",
  refunded: "İade edildi",
};

export const CARGO_STATUS_OPTIONS = ["paid", "preparing", "shipped", "completed"] as const;

const CARGO_RANK: Record<string, number> = {
  draft: 0,
  pending_payment: 0,
  failed: 0,
  cancelled: 0,
  paid: 1,
  preparing: 2,
  shipped: 3,
  completed: 4,
};

export type ShippingStep = {
  key: "paid" | "preparing" | "shipped" | "completed";
  title: string;
  done: boolean;
  current: boolean;
};

export function customerShippingCopy(status: string, officePickup = false) {
  if (status === "pending_payment") {
    return {
      title: "Ödemeniz bekleniyor",
      detail: "Ödeme görününce kargo hazırlığına alınır.",
    };
  }
  if (status === "cancelled") {
    return { title: "Sipariş iptal edildi", detail: "Bu sipariş kargoya verilmeyecek." };
  }
  if (status === "failed") {
    return { title: "Sipariş tamamlanamadı", detail: "Ödeme alınamadı. Yeni sipariş oluşturabilirsiniz." };
  }
  if (officePickup) {
    if (status === "paid") {
      return { title: "Siparişiniz alındı", detail: "Hazırlık başlayınca ofisten teslim için haber veririz." };
    }
    if (status === "preparing") {
      return { title: "Siparişiniz hazırlanıyor", detail: "Paketleme tamamlanınca teslime hazır olacak." };
    }
    if (status === "shipped") {
      return { title: "Siparişiniz teslime hazır", detail: "Ofisten teslim alabilirsiniz." };
    }
    if (status === "completed") {
      return { title: "Teslim alındı", detail: "Siparişiniz teslim edildi. Teşekkürler." };
    }
  }
  if (status === "paid") {
    return { title: "Siparişiniz alındı", detail: "Ödemeniz onaylandı. Kargonuz sıraya alındı." };
  }
  if (status === "preparing") {
    return { title: "Kargonuz hazırlanıyor", detail: "Ürünleriniz paketleniyor; kargoya verilmeye hazırlanıyor." };
  }
  if (status === "shipped") {
    return { title: "Kargonuz kargoya verildi", detail: "Gönderiniz yola çıktı. Teslimat adresinize ulaştırılacak." };
  }
  if (status === "completed") {
    return { title: "Kargonuz teslim edildi", detail: "Gönderiniz teslim alındı. İyi kullanımlar." };
  }
  return { title: ORDER_STATUS_LABEL[status] ?? status, detail: "" };
}

export function shippingSteps(status: string, officePickup = false): ShippingStep[] {
  const rank = CARGO_RANK[status] ?? 0;
  const labels = officePickup
    ? {
        paid: "Sipariş alındı",
        preparing: "Hazırlanıyor",
        shipped: "Teslime hazır",
        completed: "Teslim alındı",
      }
    : {
        paid: "Sipariş alındı",
        preparing: "Kargo hazırlanıyor",
        shipped: "Kargoya verildi",
        completed: "Teslim edildi",
      };
  return CARGO_STATUS_OPTIONS.map((key) => {
    const stepRank = CARGO_RANK[key];
    return {
      key,
      title: labels[key],
      done: rank >= stepRank,
      current: rank === stepRank && rank > 0,
    };
  });
}

export function isOfficePickup(note: string | null | undefined) {
  return (note ?? "").includes("Teslimat: Ofisten teslim al");
}
