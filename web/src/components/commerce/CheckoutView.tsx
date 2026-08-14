"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CreditCard,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { SITE_CONTACT } from "@/data/catalog-page";
import { formatPriceTry } from "@/lib/media";

export type CheckoutLine = {
  name: string;
  color: string | null;
  quantity: number;
  image: string;
  lineGross: number;
};

type Step = "delivery" | "payment" | "confirm";
type DeliveryMethod = "address" | "office";
type InvoiceType = "individual" | "corporate";
type PaymentMethod = "card" | "transfer";

const CITIES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Kocaeli",
  "Konya",
  "Adana",
  "Gaziantep",
  "Mersin",
];

const STEPS = [
  { id: "cart", label: "Sepetim", icon: "check" as const },
  { id: "delivery", label: "Teslimat Bilgileri", icon: "check" as const },
  { id: "payment", label: "Ödeme Yöntemi", icon: "card" as const },
  { id: "confirm", label: "Sipariş Onayı", icon: null },
  { id: "done", label: "Sipariş Tamamlandı", icon: "check" as const },
] as const;

const inputClass =
  "mt-1 block h-11 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-orange";

function money(n: number) {
  return `₺${formatPriceTry(n)}`;
}

export function CheckoutView({
  loggedIn,
  iyzicoReady,
  userName,
  userEmail,
  items,
  subtotal,
  vat,
  vatLabel,
}: {
  loggedIn: boolean;
  iyzicoReady: boolean;
  userName?: string;
  userEmail?: string;
  items: CheckoutLine[];
  subtotal: number;
  vat: number;
  vatLabel: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("delivery");
  const [delivery, setDelivery] = useState<DeliveryMethod>("address");
  const [invoice, setInvoice] = useState<InvoiceType>("individual");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [billingDifferent, setBillingDifferent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: userName ?? "",
    email: userEmail ?? "",
    phone: "",
    city: "İstanbul",
    district: "",
    line: "",
    postalCode: "",
  });

  const grand = subtotal + vat;
  const office = delivery === "office";

  const payload = useMemo(
    () => ({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      city: office ? "İstanbul" : form.city,
      district: office ? "Tuzla" : form.district,
      line: office ? SITE_CONTACT.address : form.line,
      postalCode: form.postalCode,
      deliveryMethod: delivery,
      invoiceType: invoice,
      paymentMethod: payment,
    }),
    [form, office, delivery, invoice, payment],
  );

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateDelivery() {
    if (form.fullName.trim().length < 2) return "Ad soyad girin";
    if (form.phone.trim().length < 10) return "Telefon numarasını girin";
    if (!office) {
      if (form.district.trim().length < 2) return "İlçe girin";
      if (form.line.trim().length < 6) return "Adres girin";
    }
    return null;
  }

  function goPayment() {
    const issue = validateDelivery();
    if (issue) {
      setError(issue);
      return;
    }
    setError(null);
    setStep("payment");
  }

  async function placeOrder() {
    if (!loggedIn) {
      setError("Siparişi tamamlamak için giriş yapın");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string; orderNumber?: string };
      if (!res.ok || !data.orderNumber) {
        setError(data.error || "Sipariş oluşturulamadı");
        return;
      }
      router.push(`/siparislerim/${data.orderNumber}`);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  const activeIndex = step === "delivery" ? 1 : step === "payment" ? 2 : 3;

  return (
    <div className="w-full">
      <h1 className="mb-5 text-[20px] font-extrabold tracking-wide text-navy uppercase sm:mb-6 sm:text-[22px]">
        Sipariş Tamamlama
      </h1>

      <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,42%)] xl:grid-cols-[minmax(0,1fr)_520px] 2xl:grid-cols-[minmax(0,1fr)_580px]">
        <div className="w-full min-w-0">
          <div className="relative mb-6 sm:mb-8">
            <div
              className="pointer-events-none absolute top-4 right-[8%] left-[8%] border-t border-dashed border-[#c5c9ce] sm:top-[18px]"
              aria-hidden
            />
            <div className="relative z-10 flex w-full items-start justify-between">
              {STEPS.map((item, i) => {
                const done = i < activeIndex;
                const current = i === activeIndex;
                const circle = done
                  ? "bg-orange text-white"
                  : current
                    ? "bg-navy text-white"
                    : "bg-[#c8ccd2] text-white";
                const label = done || current ? "text-[#1a1a1a]" : "text-[#9aa0a6]";
                const inner = (
                  <>
                    <span
                      className={`flex size-8 items-center justify-center rounded-full text-[13px] font-extrabold sm:size-9 sm:text-[14px] ${circle}`}
                      style={{ color: "#ffffff" }}
                    >
                      {i + 1}
                    </span>
                    <span className={`mt-2 hidden max-w-full items-center justify-center gap-1 text-center text-[10px] leading-tight font-bold sm:inline-flex md:text-[12px] ${label}`}>
                      <span className="break-words">{item.label}</span>
                      {item.icon === "check" ? (
                        <Check className={`hidden size-3.5 shrink-0 md:block ${done || current ? "text-navy" : "text-[#b0b4ba]"}`} strokeWidth={3} />
                      ) : null}
                      {item.icon === "card" ? (
                        <CreditCard className={`hidden size-3.5 shrink-0 md:block ${done || current ? "text-navy" : "text-[#b0b4ba]"}`} />
                      ) : null}
                    </span>
                  </>
                );
                if (item.id === "cart") {
                  return (
                    <Link key={item.id} href="/sepet" className="flex w-[18%] min-w-0 flex-col items-center text-center">
                      {inner}
                    </Link>
                  );
                }
                return (
                  <div key={item.id} className="flex w-[18%] min-w-0 flex-col items-center text-center">
                    {inner}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[13px] font-extrabold text-navy sm:hidden">
              {STEPS[activeIndex].label}
            </p>
          </div>

          {!loggedIn ? (
            <p className="mb-4 w-full rounded-md border border-[#f3d7a3] bg-[#fff8eb] px-4 py-3 text-[13px] leading-relaxed">
              Siparişi tamamlamak için{" "}
              <Link href="/giris" className="font-bold text-navy">
                giriş yapın
              </Link>{" "}
              veya{" "}
              <Link href="/kayit" className="font-bold text-navy">
                üye olun
              </Link>
              . Teslimat bilgilerini şimdiden doldurabilirsiniz.
            </p>
          ) : null}

          {step === "delivery" ? (
            <section className="w-full rounded-md border border-line bg-white p-5">
              <h2 className="text-[18px] font-extrabold tracking-wide text-[#111] uppercase">
                Teslimat Bilgileri
              </h2>
              <div className="mt-4 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setDelivery("address")}
                  className={`flex w-full items-start gap-3 rounded-md border p-4 text-left ${
                    delivery === "address" ? "border-orange bg-[#fff8f0]" : "border-line bg-white"
                  }`}
                >
                  <Truck className={`mt-0.5 size-5 shrink-0 ${delivery === "address" ? "text-orange" : "text-[#888]"}`} />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-extrabold text-[#111]">Adresime Gönder</span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-[#6b7280]">
                      Siparişinizi belirttiğiniz adrese gönderelim.
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDelivery("office")}
                  className={`flex w-full items-start gap-3 rounded-md border p-4 text-left ${
                    delivery === "office" ? "border-orange bg-[#fff8f0]" : "border-line bg-white"
                  }`}
                >
                  <Building2 className={`mt-0.5 size-5 shrink-0 ${delivery === "office" ? "text-orange" : "text-[#888]"}`} />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-extrabold text-[#111]">Ofisten teslim al</span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-[#6b7280]">
                      Siparişinizi Tuzla ofisimizden teslim alabilirsiniz.
                    </span>
                  </span>
                </button>
              </div>

              <div className="mt-5 grid w-full grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                  Ad Soyad
                  <input value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} className={inputClass} />
                </label>
                <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                  E-posta Adresi
                  <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputClass} />
                </label>
                <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                  Telefon Numarası
                  <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={inputClass} />
                </label>
              </div>

              {office ? (
                <div className="mt-4 rounded-md border border-[#d7e8f6] bg-[#eef6fb] px-4 py-3 text-[13px] leading-relaxed text-[#334]">
                  Teslimat adresi: <strong>{SITE_CONTACT.address}</strong>
                </div>
              ) : (
                <>
                  <div className="mt-3 grid w-full grid-cols-1 gap-3 md:grid-cols-3">
                    <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                      Ülke
                      <input value="Türkiye" disabled className={`${inputClass} bg-[#f7f8fa]`} />
                    </label>
                    <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                      Şehir
                      <select value={form.city} onChange={(e) => setField("city", e.target.value)} className={inputClass}>
                        {CITIES.map((city) => (
                          <option key={city}>{city}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                      İlçe
                      <input value={form.district} onChange={(e) => setField("district", e.target.value)} className={inputClass} />
                    </label>
                  </div>
                  <div className="mt-3 grid w-full grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                    <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                      Adres
                      <textarea
                        value={form.line}
                        onChange={(e) => setField("line", e.target.value)}
                        className="mt-1 block h-24 w-full rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-orange"
                      />
                    </label>
                    <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                      Posta Kodu
                      <input value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} className={inputClass} />
                    </label>
                  </div>
                </>
              )}

              <label className="mt-4 flex items-center gap-2 text-[13px] text-[#333]">
                <input
                  type="checkbox"
                  checked={billingDifferent}
                  onChange={(e) => setBillingDifferent(e.target.checked)}
                />
                Fatura adresim farklı
              </label>
              {billingDifferent ? (
                <p className="mt-2 text-[12px] leading-relaxed text-[#6b7280]">
                  Fatura adresi sipariş notuna işlenir; kurumsal bilgiler bir sonraki adımda netleştirilir.
                </p>
              ) : null}

              <h2 className="mt-8 text-[18px] font-extrabold tracking-wide text-[#111] uppercase">
                Fatura Bilgileri
              </h2>
              <div className="mt-3 flex flex-wrap gap-6 text-[14px]">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="invoice"
                    checked={invoice === "individual"}
                    onChange={() => setInvoice("individual")}
                  />
                  Bireysel
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="invoice"
                    checked={invoice === "corporate"}
                    onChange={() => setInvoice("corporate")}
                  />
                  Kurumsal
                </label>
              </div>
              {invoice === "corporate" ? (
                <div className="mt-3 rounded-md border border-[#d7e8f6] bg-[#eef6fb] px-4 py-3 text-[13px] leading-relaxed text-[#334]">
                  Kurumsal fatura için bilgilerinizi bir sonraki adımda girebilirsiniz.
                </div>
              ) : null}
            </section>
          ) : null}

          {step === "payment" ? (
            <section className="w-full rounded-md border border-line bg-white p-5">
              <h2 className="text-[18px] font-extrabold tracking-wide text-[#111] uppercase">
                Ödeme Yöntemi
              </h2>
              <div className="mt-4 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPayment("card")}
                  className={`w-full rounded-md border p-4 text-left ${
                    payment === "card" ? "border-orange bg-[#fff8f0]" : "border-line"
                  }`}
                >
                  <span className="block text-[14px] font-extrabold">Kredi Kartı</span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-[#6b7280]">
                    {iyzicoReady ? "3D Secure ile güvenli ödeme." : "Iyzico bağlanınca kart ödemesi açılacak."}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayment("transfer")}
                  className={`w-full rounded-md border p-4 text-left ${
                    payment === "transfer" ? "border-orange bg-[#fff8f0]" : "border-line"
                  }`}
                >
                  <span className="block text-[14px] font-extrabold">Havale / EFT</span>
                  <span className="mt-1 block text-[12px] leading-relaxed text-[#6b7280]">
                    Sipariş onayından sonra hesap bilgileri iletilecek.
                  </span>
                </button>
              </div>
            </section>
          ) : null}

          {step === "confirm" ? (
            <section className="w-full rounded-md border border-line bg-white p-5">
              <h2 className="text-[18px] font-extrabold tracking-wide text-[#111] uppercase">
                Sipariş Onayı
              </h2>
              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between gap-4 border-b border-line py-2">
                  <dt className="text-[#6b7280]">Teslimat</dt>
                  <dd className="text-right font-semibold">
                    {office ? "Ofisten teslim al" : "Adrese gönderim"}
                    <span className="mt-1 block font-normal text-[#555]">
                      {office ? SITE_CONTACT.address : `${form.line}, ${form.district} / ${form.city}`}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line py-2">
                  <dt className="text-[#6b7280]">Fatura</dt>
                  <dd className="font-semibold">{invoice === "corporate" ? "Kurumsal" : "Bireysel"}</dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-[#6b7280]">Ödeme</dt>
                  <dd className="font-semibold">{payment === "transfer" ? "Havale / EFT" : "Kredi kartı"}</dd>
                </div>
              </dl>
            </section>
          ) : null}

          {error ? <p className="mt-4 text-[13px] text-brand-red">{error}</p> : null}

          <div className="mt-5 flex w-full flex-wrap items-center justify-between gap-3">
            {step === "delivery" ? (
              <Link
                href="/sepet"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-white px-4 text-[12px] font-extrabold tracking-wide text-navy"
              >
                <ArrowLeft className="size-4" />
                Sepete Dön
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setStep(step === "confirm" ? "payment" : "delivery")}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-line bg-white px-4 text-[12px] font-extrabold tracking-wide text-navy"
              >
                <ArrowLeft className="size-4" />
                Geri
              </button>
            )}
            {step === "confirm" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => void placeOrder()}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-orange px-5 text-[13px] font-extrabold tracking-wide text-[#111] hover:bg-orange-hover disabled:opacity-60"
              >
                {pending ? "Oluşturuluyor…" : "Siparişi Onayla"}
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (step === "delivery") goPayment();
                  else setStep("confirm");
                }}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-orange px-5 text-[13px] font-extrabold tracking-wide text-[#111] hover:bg-orange-hover"
              >
                Devam Et
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>

        <aside className="w-full min-w-0 lg:sticky lg:top-4">
          <div className="rounded-md border border-line bg-white p-5 sm:p-7">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[16px] font-extrabold tracking-wide text-navy uppercase sm:text-[18px]">
                Sipariş Özeti
              </h2>
              <span className="text-[13px] text-[#8b919a] sm:text-[14px]">
                {items.length.toLocaleString("tr-TR")} Ürün
              </span>
            </div>
            <ul className="mt-5 divide-y divide-line">
              {items.map((item, i) => (
                <li key={`${item.name}-${item.color ?? "x"}-${i}`} className="flex items-start gap-4 py-4 sm:py-5">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded border border-line bg-soft sm:size-[88px]">
                    <Image src={item.image} alt="" fill unoptimized className="object-contain p-1.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-snug font-extrabold break-words text-navy sm:text-[15px]">
                      {item.name}
                    </p>
                    {item.color ? (
                      <p className="mt-1.5 text-[13px] text-[#6b7280] sm:text-[14px]">{item.color}</p>
                    ) : null}
                    <p className="text-[13px] text-[#6b7280] sm:text-[14px]">
                      {item.quantity.toLocaleString("tr-TR")} adet
                    </p>
                  </div>
                  <p className="shrink-0 pt-0.5 text-[14px] font-extrabold whitespace-nowrap text-navy sm:text-[16px]">
                    {money(item.lineGross)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-3 text-[14px] sm:text-[15px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#666]">Ara Toplam</dt>
                <dd className="font-semibold">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#666]">{vatLabel}</dt>
                <dd className="font-semibold">{money(vat)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-line pb-4">
                <dt className="text-[#666]">Kargo</dt>
                <dd className="font-semibold text-brand-green">Ücretsiz</dd>
              </div>
              <div className="flex items-end justify-between gap-3 pt-2">
                <dt>
                  <span className="block text-[14px] font-extrabold tracking-wide text-navy uppercase sm:text-[16px]">
                    Genel Toplam
                  </span>
                  <span className="mt-0.5 block text-[12px] font-normal text-[#8b919a]">KDV Dahil</span>
                </dt>
                <dd className="text-[22px] leading-none font-extrabold whitespace-nowrap text-navy sm:text-[26px]">
                  {money(grand)}
                </dd>
              </div>
            </dl>
            <ul className="mt-4 space-y-2 text-[11px] text-[#6b7280]">
              <li className="flex items-center gap-2">
                <Lock className="size-3.5 shrink-0 text-navy" />
                256 Bit SSL ile Güvenli Alışveriş
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 shrink-0 text-navy" />
                3D Secure ile Güvenli Ödeme
              </li>
              <li className="flex items-center gap-2">
                <RefreshCcw className="size-3.5 shrink-0 text-navy" />
                Kolay İade ve Değişim
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
