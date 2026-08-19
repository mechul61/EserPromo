export const PRICE_VAT_HINT = "+ KDV";

export function PriceVatNote({ className = "mt-1 text-[12px] text-[#8b919a]" }: { className?: string }) {
  return <p className={className}>{PRICE_VAT_HINT}</p>;
}
