import { SITE_CONTACT } from "@/data/catalog-page";

export const EMAIL_CATEGORY_LABEL = {
  order: "Sipariş",
  customer: "Müşteri",
  marketing: "Pazarlama",
  other: "Diğer",
} as const;

export const EMAIL_LANGUAGE_LABEL = {
  tr: "Türkçe",
  en: "English",
} as const;

export type EmailCategoryId = keyof typeof EMAIL_CATEGORY_LABEL;
export type EmailLanguageId = keyof typeof EMAIL_LANGUAGE_LABEL;
export type EmailVars = Record<string, string>;

export const EMAIL_VARIABLES: Array<{ key: string; label: string }> = [
  { key: "customer_name", label: "Müşteri adı" },
  { key: "order_number", label: "Sipariş numarası" },
  { key: "order_total", label: "Sipariş tutarı" },
  { key: "order_date", label: "Sipariş tarihi" },
  { key: "order_url", label: "Sipariş detay bağlantısı" },
  { key: "tracking_no", label: "Kargo takip no" },
  { key: "tracking_url", label: "Kargo takip bağlantısı" },
  { key: "cargo_company", label: "Kargo firması" },
  { key: "reset_url", label: "Şifre yenileme bağlantısı" },
  { key: "product_name", label: "Ürün adı" },
  { key: "product_url", label: "Ürün bağlantısı" },
  { key: "price_line", label: "Fiyat satırı" },
  { key: "site_name", label: "Mağaza adı" },
  { key: "site_url", label: "Site adresi" },
  { key: "support_email", label: "Destek e-postası" },
  { key: "support_phone", label: "Destek telefonu" },
  { key: "ticket_no", label: "Destek talep no" },
  { key: "ticket_subject", label: "Destek konusu" },
  { key: "reply_body", label: "Destek yanıtı" },
  { key: "ticket_url", label: "Destek talebi bağlantısı" },
];

export const SAMPLE_EMAIL_VARS: EmailVars = {
  customer_name: "Ahmet Yılmaz",
  order_number: "ESER-26-1",
  order_total: "₺1.250,00",
  order_date: "18.08.2026",
  order_url: "https://eserpromo.com/siparislerim/ESER-26-1/",
  tracking_no: "1234567890",
  tracking_url: "https://www.yurticikargo.com",
  cargo_company: "Yurtiçi Kargo",
  reset_url: "https://eserpromo.com/sifre-yenile/ornek/",
  product_name: "Termos Bardak",
  product_url: "https://eserpromo.com/",
  price_line: "₺180,00 → ₺149,00",
  site_name: "Eser Promo",
  site_url: "https://eserpromo.com",
  support_email: SITE_CONTACT.email,
  support_phone: SITE_CONTACT.phone,
  ticket_no: "DSK-2026-0001",
  ticket_subject: "Sipariş durumu",
  reply_body: "Talebiniz incelendi, en kısa sürede dönüş yapacağız.",
  ticket_url: "https://eserpromo.com/hesabim/destek/",
};

export function interpolate(template: string, vars: EmailVars) {
  return template.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function paragraphsHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(block).replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

export function renderEmailHtml(input: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  showOrderBox: boolean;
  vars: EmailVars;
}) {
  const heading = interpolate(input.heading, input.vars);
  const body = interpolate(input.body, input.vars);
  const ctaLabel = interpolate(input.ctaLabel, input.vars);
  const ctaUrl = interpolate(input.ctaUrl, input.vars);
  const site = input.vars.site_url || "https://eserpromo.com";
  const orderBox =
    input.showOrderBox && input.vars.order_number
      ? `<div style="margin:20px 0;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e8edf3;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;">Sipariş Detayları</p>
          <p style="margin:0;font-size:13px;color:#0f172a;"><strong>Sipariş No:</strong> ${escapeHtml(input.vars.order_number)}</p>
          ${input.vars.order_date ? `<p style="margin:6px 0 0;font-size:13px;color:#0f172a;"><strong>Tarih:</strong> ${escapeHtml(input.vars.order_date)}</p>` : ""}
          ${input.vars.order_total ? `<p style="margin:6px 0 0;font-size:13px;color:#0f172a;"><strong>Tutar:</strong> ${escapeHtml(input.vars.order_total)}</p>` : ""}
        </div>`
      : "";
  const cta =
    ctaLabel && ctaUrl
      ? `<p style="margin:24px 0 0;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#2f6bff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;">${escapeHtml(ctaLabel)}</a></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="tr"><body style="margin:0;background:#f5f7fb;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;padding:28px;border:1px solid #e8edf3;">
        <tr><td>
          <p style="margin:0 0 18px;font-size:20px;font-weight:800;color:#0f172a;">eserPromo</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">${escapeHtml(heading)}</h1>
          ${paragraphsHtml(body)}
          ${orderBox}
          ${cta}
          <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;">${escapeHtml(SITE_CONTACT.email)} · ${escapeHtml(SITE_CONTACT.phone)}<br/><a href="${escapeHtml(site)}" style="color:#2f6bff;text-decoration:none;">${escapeHtml(site)}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
