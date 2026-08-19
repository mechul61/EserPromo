import { Check, ExternalLink, Package, Truck } from "lucide-react";
import { CARGO_COMPANIES, cargoTrackingUrl, isCargoCompany } from "@/lib/commerce/cargo";
import { customerShippingCopy, shippingSteps } from "@/lib/commerce/orders-copy";

export function ShippingTracker({
  status,
  officePickup = false,
  trackingNo = "",
  trackingUrl = "",
  cargoCompany = "",
}: {
  status: string;
  officePickup?: boolean;
  trackingNo?: string;
  trackingUrl?: string;
  cargoCompany?: string;
}) {
  const copy = customerShippingCopy(status, officePickup);
  const steps = shippingSteps(status, officePickup);
  const blocked = status === "cancelled" || status === "failed";
  const href = cargoTrackingUrl(cargoCompany, trackingNo, trackingUrl);

  return (
    <section className="rounded-md border border-line bg-white p-5">
      <div className="flex items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-md ${
            blocked ? "bg-[#fdecec] text-brand-red" : "bg-[#eef3fb] text-navy"
          }`}
        >
          <Truck className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold tracking-wide text-navy uppercase">{copy.title}</h2>
          {copy.detail ? <p className="mt-1 text-[13px] text-[#6b7280]">{copy.detail}</p> : null}
        </div>
      </div>

      {!blocked ? (
        <ol className="mt-5 grid gap-0 sm:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.key} className="relative flex sm:flex-col">
              {index < steps.length - 1 ? (
                <span
                  className={`absolute top-4 left-8 right-0 hidden h-0.5 sm:block ${
                    step.done ? "bg-navy" : "bg-line"
                  }`}
                />
              ) : null}
              <div className="flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                <span
                  className={`relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                    step.done ? "bg-navy text-white" : "bg-soft text-[#9ca3af]"
                  }`}
                >
                  {step.done ? <Check className="size-4" /> : index + 1}
                </span>
                <p className={`pt-1 text-[12px] font-extrabold ${step.done ? "text-navy" : "text-[#9ca3af]"}`}>
                  {step.title}
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {status === "preparing" && !officePickup ? (
        <p className="mt-4 flex items-center gap-2 text-[12px] text-[#6b7280]">
          <Package className="size-4" />
          Paketleme tamamlanınca durum “Kargoya verildi” olarak güncellenir.
        </p>
      ) : null}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-navy hover:text-orange"
        >
          {isCargoCompany(cargoCompany) ? CARGO_COMPANIES[cargoCompany] : "Kargo"} takip
          {trackingNo ? ` · ${trackingNo}` : ""}
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </section>
  );
}
