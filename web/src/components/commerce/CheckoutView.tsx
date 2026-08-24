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
  Copy,
  CreditCard,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { SITE_CONTACT } from "@/data/catalog-page";
import { formatPriceTry } from "@/lib/media";
import { formatPhoneTR, isValidTRPhone, phoneDigits } from "@/lib/phone";
import { passwordPolicyError } from "@/lib/auth/password-policy";
import { PasswordRules } from "@/components/commerce/PasswordRules";
import { CityDistrictFields } from "@/components/forms/CityDistrictFields";
import { BankLogo } from "@/components/banks/BankLogo";
import { formatIban as formatIbanDisplay } from "@/data/turkey-banks";
import { shippingCharge, type SiteSettings } from "@/lib/site-settings";

export type CheckoutLine = {
  name: string;
  color: string | null;
  quantity: number;
  image: string;
  lineNet: number;
};

type Step = "delivery" | "payment" | "confirm";
type DeliveryMethod = "address" | "office";
type InvoiceType = "individual" | "corporate";
type PaymentMethod = "card" | "transfer";

const STEPS = [
  { id: "cart", label: "Sepetim", icon: "check" as const },
  { id: "delivery", label: "Teslimat Bilgileri", icon: "check" as const },
  { id: "payment", label: "Ödeme Yöntemi", icon: "card" as const },
  { id: "confirm", label: "Sipariş Onayı", icon: null },
  { id: "done", label: "Sipariş Tamamlandı", icon: "check" as const },
] as const;

const inputClass =
  "mt-1 block h-11 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-orange";

function CopyField({
  label,
  value,
  copyValue,
  inputClassName = "",
}: {
  label: string;
  value: string;
  copyValue?: string;
  inputClassName?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyValue ?? value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <label className="block min-w-0 text-[12px] font-bold text-[#555] sm:col-span-2">
      {label}
      <span className="relative mt-1 block">
        <input
          value={value}
          readOnly
          className={`${inputClass} mt-0 bg-soft pr-11 ${inputClassName}`}
        />
        <button
          type="button"
          onClick={() => void copy()}
          title={copied ? "Kopyalandı" : "Kopyala"}
          aria-label={copied ? "Kopyalandı" : `${label} kopyala`}
          className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-navy hover:bg-white"
        >
          {copied ? <Check className="size-4 text-[#1f9d55]" /> : <Copy className="size-4" />}
        </button>
      </span>
    </label>
  );
}

function money(n: number) {
  return `₺${formatPriceTry(n)}`;
}

export function CheckoutView({
  loggedIn,
  iyzicoReady,
  paymentMethods,
  userName,
  userEmail,
  items,
  subtotal,
  vat,
  vatLabel,
  coupon,
  transferBanks,
  orderNoteEnabled = false,
  minOrderAmount = 0,
  shipping,
}: {
  loggedIn: boolean;
  iyzicoReady: boolean;
  paymentMethods: Array<{ key: PaymentMethod; name: string; description: string }>;
  userName?: string;
  userEmail?: string;
  items: CheckoutLine[];
  subtotal: number;
  vat: number;
  vatLabel: string;
  coupon: { code: string; name: string; amount: number; label: string } | null;
  transferBanks: Array<{
    id: string;
    name: string;
    holder: string;
    iban: string;
    accountType: string;
  }>;
  orderNoteEnabled?: boolean;
  minOrderAmount?: number;
  shipping: SiteSettings["shipping"];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("delivery");
  const [delivery, setDelivery] = useState<DeliveryMethod>("address");
  const [invoice, setInvoice] = useState<InvoiceType>("individual");
  const [payment, setPayment] = useState<PaymentMethod>(() => paymentMethods[0]?.key ?? "card");
  const [transferBank, setTransferBank] = useState(() => (transferBanks.length === 1 ? transferBanks[0].id : ""));
  const selectedAccount = transferBanks.find((bank) => bank.id === transferBank) ?? null;
  const [billingDifferent, setBillingDifferent] = useState(false);
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [hasAccount, setHasAccount] = useState(loggedIn);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState(coupon?.code ?? "");
  const [applied, setApplied] = useState(coupon);
  const [form, setForm] = useState({
    fullName: userName ?? "",
    email: userEmail ?? "",
    phone: "",
    city: "İstanbul",
    district: "",
    line: "",
    postalCode: "",
  });
  const [billing, setBilling] = useState({
    fullName: userName ?? "",
    phone: "",
    city: "İstanbul",
    district: "",
    line: "",
    postalCode: "",
    tcKimlik: "",
    companyName: "",
    taxOffice: "",
    taxNumber: "",
  });
  const [orderNote, setOrderNote] = useState("");

  const goods = subtotal + vat;
  const shippingTotal = Math.max(0, shippingCharge(Math.max(0, goods - (applied?.amount ?? 0)), { shipping }));
  const grand = Math.max(0, goods - (applied?.amount ?? 0)) + shippingTotal;
  const office = delivery === "office";
  const selectedMethod = paymentMethods.find((method) => method.key === payment) ?? paymentMethods[0] ?? null;

  async function applyCoupon() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/cart/coupon/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ code: couponCode }),
      });
      const data = (await res.json()) as {
        error?: string;
        coupon?: { code: string; name: string; amount: number; label: string } | null;
      };
      if (!res.ok) {
        setError(data.error || "Kupon uygulanamadı");
        return;
      }
      setApplied(data.coupon ?? null);
      if (data.coupon) setCouponCode(data.coupon.code);
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  async function removeCoupon() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/cart/coupon/", { method: "DELETE", credentials: "same-origin" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Kupon kaldırılamadı");
        return;
      }
      setApplied(null);
      setCouponCode("");
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  const payload = useMemo(
    () => ({
      fullName: form.fullName,
      email: form.email,
      phone: phoneDigits(form.phone),
      city: office ? "İstanbul" : form.city,
      district: office ? "Tuzla" : form.district,
      line: office ? SITE_CONTACT.address : form.line,
      postalCode: form.postalCode,
      deliveryMethod: delivery,
      invoiceType: billingDifferent ? invoice : "individual",
      paymentMethod: payment,
      transferBank: payment === "transfer" ? transferBank.trim() : undefined,
      billingDifferent,
      billingFullName: billingDifferent ? billing.fullName : undefined,
      billingPhone: billingDifferent ? phoneDigits(billing.phone) : undefined,
      billingCity: billingDifferent ? billing.city : undefined,
      billingDistrict: billingDifferent ? billing.district : undefined,
      billingLine: billingDifferent ? billing.line : undefined,
      billingPostalCode: billingDifferent ? billing.postalCode : undefined,
      tcKimlik: billingDifferent && invoice === "individual" ? billing.tcKimlik : undefined,
      companyName: billingDifferent && invoice === "corporate" ? billing.companyName : undefined,
      taxOffice: billingDifferent && invoice === "corporate" ? billing.taxOffice : undefined,
      taxNumber: billingDifferent && invoice === "corporate" ? billing.taxNumber : undefined,
      orderNote: orderNote.trim() || undefined,
    }),
    [form, office, delivery, invoice, payment, transferBank, billingDifferent, billing, orderNote],
  );

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setBillingField(key: keyof typeof billing, value: string) {
    setBilling((prev) => ({ ...prev, [key]: value }));
  }

  function validateDelivery() {
    if (form.fullName.trim().length < 2) return "Ad soyad girin";
    if (!isValidTRPhone(form.phone)) return "Geçerli bir telefon numarası girin";
    if (!office) {
      if (form.district.trim().length < 2) return "İlçe girin";
      if (form.line.trim().length < 6) return "Adres girin";
    }
    if (billingDifferent) {
      if (!isValidTRPhone(billing.phone)) return "Geçerli bir fatura telefonu girin";
      if (billing.district.trim().length < 2) return "Fatura ilçesi girin";
      if (billing.line.trim().length < 6) return "Fatura adresi girin";
      if (invoice === "individual") {
        if (billing.fullName.trim().length < 2) return "Fatura ad soyad girin";
        const tc = billing.tcKimlik.replace(/\D/g, "");
        if (tc.length !== 11) return "TC Kimlik No 11 haneli olmalıdır";
      } else {
        if (billing.companyName.trim().length < 2) return "Şirket unvanı girin";
        if (billing.taxOffice.trim().length < 2) return "Vergi dairesi girin";
        const vn = billing.taxNumber.replace(/\D/g, "");
        if (vn.length < 10) return "Vergi numarası girin";
      }
    }
    return null;
  }

  function validateAccount() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Hesap için geçerli bir e-posta girin";
    }
    const policy = passwordPolicyError(password);
    if (policy) return policy;
    if (password !== passwordConfirm) return "Şifreler eşleşmiyor";
    return null;
  }

  async function goPayment() {
    const issue = validateDelivery();
    if (issue) {
      setError(issue);
      return;
    }
    if (!hasAccount && createAccount) {
      const accountIssue = validateAccount();
      if (accountIssue) {
        setError(accountIssue);
        return;
      }
      setPending(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/register/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.fullName,
            email: form.email,
            password,
            phone: phoneDigits(form.phone),
            city: office ? undefined : form.city,
            district: office ? undefined : form.district,
            line: office ? undefined : form.line,
            postalCode: office ? undefined : form.postalCode,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error || "Hesap oluşturulamadı");
          return;
        }
        setHasAccount(true);
        router.refresh();
      } catch {
        setError("Hesap oluşturulurken bağlantı hatası");
        return;
      } finally {
        setPending(false);
      }
    }
    if (paymentMethods.length === 0) {
      setError("Şu an aktif ödeme yöntemi yok");
      return;
    }
    setError(null);
    setStep("payment");
  }

  function validateTransfer() {
    if (payment !== "transfer") return null;
    if (transferBanks.length === 0) return "Havale / EFT için henüz banka tanımlanmadı";
    if (!selectedAccount) return "Listeden banka seçin";
    return null;
  }

  async function placeOrder() {
    if (!hasAccount) {
      setError("Siparişi tamamlamak için giriş yapın veya hesap oluşturmaya izin verin");
      return;
    }
    const transferIssue = validateTransfer();
    if (transferIssue) {
      setError(transferIssue);
      return;
    }
    if (minOrderAmount > 0 && grand < minOrderAmount) {
      setError(`Minimum sipariş tutarı ${minOrderAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        orderNumber?: string;
        requiresIyzico?: boolean;
      };
      if (!res.ok || !data.orderNumber) {
        setError(data.error || "Sipariş oluşturulamadı");
        return;
      }
      if (payment === "card" && data.requiresIyzico) {
        router.push(`/siparislerim/${data.orderNumber}/odeme/`);
        return;
      }
      router.push(`/siparislerim/${data.orderNumber}/`);
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
                    <Link key={item.id} href="/sepet" className="flex flex-1 min-w-0 flex-col items-center text-center">
                      {inner}
                    </Link>
                  );
                }
                return (
                  <div key={item.id} className="flex flex-1 min-w-0 flex-col items-center text-center">
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
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0 (5__) ___ __ __"
                    value={form.phone}
                    onChange={(e) => setField("phone", formatPhoneTR(e.target.value))}
                    className={inputClass}
                  />
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
                    <CityDistrictFields
                      city={form.city}
                      district={form.district}
                      onCity={(value) => setField("city", value)}
                      onDistrict={(value) => setField("district", value)}
                      inputClass={inputClass}
                    />
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

              {!hasAccount ? (
                <div className="mt-4 rounded-md border border-[#d7e8f6] bg-[#eef6fb] p-4">
                  <label className="flex items-start gap-2 text-[13px] text-[#333]">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                    />
                    <span>
                      Kullanıcı hesabı oluşturulacak. Bu bilgilerle üye kaydı açmama{" "}
                      <strong>izin veriyor musunuz?</strong>
                    </span>
                  </label>
                  {createAccount ? (
                    <>
                      <div className="mt-3 grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                          Şifre
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={inputClass}
                          />
                        </label>
                        <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                          Şifre Tekrar
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            className={inputClass}
                          />
                        </label>
                      </div>
                      <PasswordRules value={password} />
                    </>
                  ) : null}
                </div>
              ) : null}

              <label className="mt-4 flex items-center gap-2 text-[13px] text-[#333]">
                <input
                  type="checkbox"
                  checked={billingDifferent}
                  onChange={(e) => setBillingDifferent(e.target.checked)}
                />
                Fatura adresim farklı
              </label>
              {billingDifferent ? (
                <div className="mt-4 space-y-3 rounded-md border border-line bg-[#fafbfc] p-4">
                  <h2 className="text-[18px] font-extrabold tracking-wide text-[#111] uppercase">
                    Fatura Adresi
                  </h2>
                  <div className="flex flex-wrap gap-6 text-[14px]">
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

                  {invoice === "individual" ? (
                    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
                      <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                        Ad Soyad
                        <input
                          value={billing.fullName}
                          onChange={(e) => setBillingField("fullName", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                        TC Kimlik No
                        <input
                          inputMode="numeric"
                          maxLength={11}
                          value={billing.tcKimlik}
                          onChange={(e) => setBillingField("tcKimlik", e.target.value.replace(/\D/g, "").slice(0, 11))}
                          className={inputClass}
                          placeholder="11 haneli TC Kimlik No"
                        />
                      </label>
                      <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                        Telefon
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="0 (5__) ___ __ __"
                          value={billing.phone}
                          onChange={(e) => setBillingField("phone", formatPhoneTR(e.target.value))}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="block min-w-0 text-[12px] font-bold text-[#555] md:col-span-2">
                        Şirket Unvanı
                        <input
                          value={billing.companyName}
                          onChange={(e) => setBillingField("companyName", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                        Vergi Dairesi
                        <input
                          value={billing.taxOffice}
                          onChange={(e) => setBillingField("taxOffice", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                        Vergi No
                        <input
                          inputMode="numeric"
                          maxLength={11}
                          value={billing.taxNumber}
                          onChange={(e) => setBillingField("taxNumber", e.target.value.replace(/\D/g, "").slice(0, 11))}
                          className={inputClass}
                        />
                      </label>
                      <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                        Yetkili Ad Soyad
                        <input
                          value={billing.fullName}
                          onChange={(e) => setBillingField("fullName", e.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                        Telefon
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="0 (5__) ___ __ __"
                          value={billing.phone}
                          onChange={(e) => setBillingField("phone", formatPhoneTR(e.target.value))}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  )}

                  <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
                    <CityDistrictFields
                      city={billing.city}
                      district={billing.district}
                      onCity={(value) => setBillingField("city", value)}
                      onDistrict={(value) => setBillingField("district", value)}
                      inputClass={inputClass}
                    />
                    <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                      Posta Kodu
                      <input
                        value={billing.postalCode}
                        onChange={(e) => setBillingField("postalCode", e.target.value)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                    Adres
                    <textarea
                      value={billing.line}
                      onChange={(e) => setBillingField("line", e.target.value)}
                      className="mt-1 block h-24 w-full rounded-md border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-orange"
                    />
                  </label>
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
                {paymentMethods.length === 0 ? (
                  <p className="text-[13px] font-medium text-[#6b7280]">
                    Aktif ödeme yöntemi yok. Yönetim panelinden bir yöntem açın.
                  </p>
                ) : (
                  paymentMethods.map((method) => (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => setPayment(method.key)}
                      className={`w-full rounded-md border p-4 text-left ${
                        payment === method.key ? "border-orange bg-[#fff8f0]" : "border-line"
                      }`}
                    >
                      <span className="block text-[14px] font-extrabold">{method.name}</span>
                      <span className="mt-1 block text-[12px] leading-relaxed text-[#6b7280]">
                        {method.key === "card" && !iyzicoReady
                          ? "Iyzico bağlanınca kart ödemesi açılacak."
                          : method.description}
                      </span>
                    </button>
                  ))
                )}
              </div>
              {payment === "transfer" ? (
                <div className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block min-w-0 text-[12px] font-bold text-[#555] sm:col-span-2">
                    Banka adı
                    {transferBanks.length === 0 ? (
                      <p className="mt-1 text-[13px] font-medium text-[#6b7280]">
                        tanımlanmadı
                      </p>
                    ) : (
                      <div className="mt-1 grid gap-2">
                        {transferBanks.map((bank) => {
                          const active = transferBank === bank.id;
                          return (
                            <button
                              key={bank.id}
                              type="button"
                              onClick={() => setTransferBank(bank.id)}
                              className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left ${
                                active ? "border-orange bg-[#fff8f0]" : "border-line bg-white"
                              }`}
                            >
                              <BankLogo id={bank.id} size={40} />
                              <span className="min-w-0">
                                <span className="block text-[13px] font-extrabold text-navy">{bank.name}</span>
                                <span className="block text-[12px] font-medium tracking-wide text-[#6b7280]">
                                  {formatIbanDisplay(bank.iban)}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </label>
                  {selectedAccount ? (
                    <>
                      <CopyField label="Şirket / alıcı adı" value={selectedAccount.holder} />
                      <CopyField
                        label="IBAN No"
                        value={formatIbanDisplay(selectedAccount.iban)}
                        copyValue={selectedAccount.iban.replace(/\s+/g, "")}
                        inputClassName="tracking-wide"
                      />
                      <label className="block min-w-0 text-[12px] font-bold text-[#555]">
                        Hesap türü
                        <input value={selectedAccount.accountType} readOnly className={`${inputClass} bg-soft`} />
                      </label>
                    </>
                  ) : null}
                </div>
              ) : null}
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
                    <span className="mt-1 block break-words font-normal text-[#555]">
                      {office ? SITE_CONTACT.address : `${form.line}, ${form.district} / ${form.city}`}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line py-2">
                  <dt className="text-[#6b7280]">Fatura</dt>
                  <dd className="text-right font-semibold">
                    {billingDifferent ? (
                      <>
                        {invoice === "corporate" ? "Kurumsal" : "Bireysel"}
                        <span className="mt-1 block break-words font-normal text-[#555]">
                          {invoice === "corporate"
                            ? `${billing.companyName} · VD: ${billing.taxOffice} · VN: ${billing.taxNumber}`
                            : `TCKN: ${billing.tcKimlik}`}
                        </span>
                        <span className="mt-1 block break-words font-normal text-[#555]">
                          {billing.line}, {billing.district} / {billing.city}
                        </span>
                      </>
                    ) : (
                      "Teslimat adresi ile aynı"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-2">
                  <dt className="text-[#6b7280]">Ödeme</dt>
                  <dd className="text-right font-semibold">
                    {payment === "transfer" ? (
                      <>
                        {selectedMethod?.name || "Havale / EFT"}
                        <span className="mt-1 flex items-center justify-end gap-2 font-normal text-[#555]">
                          {selectedAccount ? <BankLogo id={selectedAccount.id} size={28} /> : null}
                          {selectedAccount?.name || "Banka seçilmedi"}
                        </span>
                        {selectedAccount?.holder ? (
                          <span className="mt-1 block font-normal text-[#555]">{selectedAccount.holder}</span>
                        ) : null}
                        <span className="mt-1 block font-normal tracking-wide text-[#555]">
                          {selectedAccount ? formatIbanDisplay(selectedAccount.iban) : "IBAN yok"}
                        </span>
                      </>
                    ) : (
                      selectedMethod?.name || "Kredi kartı"
                    )}
                  </dd>
                </div>
              </dl>
              {orderNoteEnabled ? (
                <label className="mt-4 block text-[13px] font-bold text-[#111]">
                  Siparişinizle ilgili notunuz
                  <textarea
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    rows={3}
                    className={`${inputClass} h-auto py-2`}
                  />
                </label>
              ) : null}
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
                disabled={pending}
                onClick={() => {
                  if (step === "delivery") void goPayment();
                  else {
                    if (paymentMethods.length === 0) {
                      setError("Şu an aktif ödeme yöntemi yok");
                      return;
                    }
                    const transferIssue = validateTransfer();
                    if (transferIssue) {
                      setError(transferIssue);
                      return;
                    }
                    setError(null);
                    setStep("confirm");
                  }
                }}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-orange px-5 text-[13px] font-extrabold tracking-wide text-[#111] hover:bg-orange-hover disabled:opacity-60"
              >
                {pending ? "Kaydediliyor…" : "Devam Et"}
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
                    {money(item.lineNet)}
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
                <dd className={`font-semibold ${shippingTotal === 0 ? "text-brand-green" : "text-[#111]"}`}>
                  {shippingTotal === 0 ? "Ücretsiz" : money(shippingTotal)}
                </dd>
              </div>
              {applied ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-[#666]">
                    Kupon ({applied.code})
                    <button type="button" className="ml-2 text-[12px] font-bold text-brand-red" onClick={() => void removeCoupon()}>
                      Kaldır
                    </button>
                  </dt>
                  <dd className="font-semibold text-brand-green">−{money(applied.amount)}</dd>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Kupon kodu"
                    className="h-10 min-w-0 flex-1 rounded-md border border-line px-3 text-[13px] outline-none"
                  />
                  <button
                    type="button"
                    disabled={pending || !couponCode.trim()}
                    onClick={() => void applyCoupon()}
                    className="h-10 rounded-md bg-navy px-3 text-[12px] font-extrabold text-white disabled:opacity-50"
                  >
                    Uygula
                  </button>
                </div>
              )}
              <div className="flex items-end justify-between gap-3 pt-2">
                <dt>
                  <span className="block text-[14px] font-extrabold tracking-wide text-navy uppercase sm:text-[16px]">
                    Genel Toplam
                  </span>
                  <span className="mt-0.5 block text-[12px] font-normal text-[#8b919a]">KDV ve kargo dahil</span>
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
