import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { ContactForm } from "@/components/commerce/ContactForm";
import { ShopChrome } from "@/components/layout/ShopChrome";
import { getCurrentUser } from "@/lib/auth/session";
import { isRecaptchaEnabled, recaptchaSiteKeyForClient } from "@/lib/security/recaptcha";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Toplu Alım / Teklif Formu",
  description:
    "Kurumsal toplu alım ve özel fiyat teklifi talebinizi iletin. Ürün, adet ve teslim bilgilerinizi paylaşın, size özel teklif hazırlayalım.",
  path: "/teklif",
});

export default async function QuoteRequestPage() {
  const [user, recaptchaEnabled] = await Promise.all([getCurrentUser(), isRecaptchaEnabled()]);
  const recaptchaSiteKey = recaptchaSiteKeyForClient();

  return (
    <ShopChrome>
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8b919a]">
        <Link href="/" className="inline-flex items-center hover:text-navy" aria-label="Ana Sayfa">
          <Home className="size-3.5" />
        </Link>
        <ChevronRight className="size-3" />
        <Link href="/" className="hover:text-navy">
          Ana Sayfa
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-[#555]">Toplu Alım / Teklif</span>
      </nav>

      <div className="mx-auto max-w-2xl rounded-xl border border-[#eceff3] bg-white p-5 sm:p-7">
        <h1 className="text-[24px] font-extrabold tracking-wide text-navy uppercase sm:text-[28px]">
          Toplu Alım / Teklif Formu
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6b7280]">
          Kurumsal siparişler ve yüksek adetli alımlar için ürün kodu, adet, teslim tarihi ve baskı
          tercihlerinizi yazın. Ekibimiz size özel fiyat teklifi hazırlasın.
        </p>

        <ContactForm
          recaptchaEnabled={recaptchaEnabled}
          recaptchaSiteKey={recaptchaSiteKey}
          defaultName={user?.name ?? ""}
          defaultEmail={user?.email ?? ""}
          defaultPhone=""
          defaultCategory="order"
          defaultSubject="Toplu alım / teklif talebi"
          bodyPlaceholder="Ürün adı veya stok kodu, adet, renk/ebat tercihi, teslim tarihi ve ek notlarınız…"
        />
      </div>
    </ShopChrome>
  );
}
