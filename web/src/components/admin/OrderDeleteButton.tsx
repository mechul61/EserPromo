"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/CouponEditor";
import { orderHasSuccessfulPayment } from "@/lib/commerce/orders-copy";

export function OrderDeleteButton({
  orderId,
  publicNumber,
  orderStatus,
  paymentStatus,
  redirectToList = false,
  onDeleted,
  compact = false,
}: {
  orderId: string;
  publicNumber: string;
  orderStatus: string;
  paymentStatus?: string;
  redirectToList?: boolean;
  onDeleted?: () => void;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paid = orderHasSuccessfulPayment({ status: orderStatus, paymentStatus });

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmPaidDeletion: paid }),
      });
      const data = (await res.json()) as { error?: string; requiresConfirmation?: boolean };
      if (res.status === 409 && data.requiresConfirmation) {
        setError(data.error || "Onay gerekli");
        setPending(false);
        return;
      }
      if (!res.ok) {
        setError(data.error || "Sipariş silinemedi");
        setPending(false);
        return;
      }
      setOpen(false);
      onDeleted?.();
      if (redirectToList) {
        router.push("/admin/siparisler");
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setError("Bağlantı hatası");
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={
          compact
            ? "inline-flex size-8 items-center justify-center rounded-lg text-[#dc2626] hover:bg-[#fef2f2]"
            : "inline-flex h-10 items-center gap-2 rounded-lg border border-[#fecaca] bg-white px-4 text-[13px] font-semibold text-[#dc2626] hover:bg-[#fef2f2]"
        }
        aria-label="Siparişi sil"
      >
        <Trash2 className="size-4" />
        {compact ? null : "Siparişi sil"}
      </button>

      {open ? (
        <ConfirmDialog
          title={paid ? "Ödemeli siparişi sil" : "Siparişi sil"}
          message={
            paid
              ? `#${publicNumber} numaralı siparişin ödemesi yapılmış. Silindiğinde sipariş kalemleri, ödeme kayıtları ve kupon kullanımı dahil tüm bilgiler kalıcı olarak kaldırılır. Yine de silmek istiyor musunuz?`
              : `#${publicNumber} numaralı siparişi kalıcı olarak silmek istediğinize emin misiniz? Siparişe ait tüm kayıtlar (ürünler, ödeme bilgisi varsa o da) silinir.`
          }
          confirm={pending ? "Siliniyor…" : "Evet, sil"}
          extra={error ? <p className="mt-3 text-[13px] text-[#dc2626]">{error}</p> : null}
          onClose={() => {
            if (pending) return;
            setOpen(false);
            setError(null);
          }}
          onConfirm={pending ? undefined : confirmDelete}
        />
      ) : null}
    </>
  );
}
