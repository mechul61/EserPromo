import { Headphones, ShieldCheck, Truck, Zap } from "lucide-react";

const items = [
  { title: "Ücretsiz Kargo", subtitle: "750 TL üzeri siparişlerde", Icon: Truck },
  { title: "Hızlı Teslimat", subtitle: "Aynı gün kargo imkanı", Icon: Zap },
  { title: "Güvenli Alışveriş", subtitle: "256 Bit SSL koruması", Icon: ShieldCheck },
  { title: "Müşteri Desteği", subtitle: "7/24 destek hattı", Icon: Headphones },
];

export function ProductTrustBar() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 bg-[#f4f5f7] px-4 py-5 sm:grid-cols-4 sm:px-6">
      {items.map(({ title, subtitle, Icon }) => (
        <div key={title} className="flex items-center gap-3">
          <Icon className="size-7 shrink-0 text-[#4b5563]" strokeWidth={1.6} />
          <div>
            <p className="text-[13px] font-bold text-[#111]">{title}</p>
            <p className="text-[12px] text-[#6b7280]">{subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
