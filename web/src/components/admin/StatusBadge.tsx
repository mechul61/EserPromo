import { ORDER_STATUS_LABEL } from "@/lib/commerce/orders";

const TONE: Record<string, string> = {
  draft: "bg-[#eef0f3] text-[#555]",
  pending_payment: "bg-[#fff4e0] text-[#9a6700]",
  paid: "bg-[#e8f7ee] text-[#1f9d55]",
  preparing: "bg-[#e8eef8] text-navy",
  shipped: "bg-[#e7f0ff] text-[#1d4ed8]",
  completed: "bg-[#e8f7ee] text-[#1f9d55]",
  cancelled: "bg-[#fdecec] text-brand-red",
  failed: "bg-[#fdecec] text-brand-red",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-[11px] font-extrabold tracking-wide ${
        TONE[status] ?? "bg-[#eef0f3] text-[#555]"
      }`}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}
