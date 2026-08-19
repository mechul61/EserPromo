import { prisma } from "@/lib/db";
import { SITE_CONTACT } from "@/data/catalog-page";
import { siteUrl } from "@/lib/env";
import { sendMail, smtpIsReady } from "@/lib/mail";
import { formatPriceTry } from "@/lib/media";
import { CARGO_COMPANIES, cargoTrackingUrl, type CargoCompanyId } from "@/lib/commerce/cargo";
import {
  interpolate,
  renderEmailHtml,
  type EmailCategoryId,
  type EmailVars,
} from "@/lib/commerce/email-copy";

export {
  EMAIL_CATEGORY_LABEL,
  EMAIL_LANGUAGE_LABEL,
  EMAIL_VARIABLES,
  SAMPLE_EMAIL_VARS,
  interpolate,
  renderEmailHtml,
} from "@/lib/commerce/email-copy";
export type { EmailCategoryId, EmailLanguageId, EmailVars } from "@/lib/commerce/email-copy";

const DEFAULTS: Array<{
  key: string;
  name: string;
  description: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  category: EmailCategoryId;
  icon: string;
  showOrderBox: boolean;
  isActive: boolean;
}> = [
  {
    key: "order_confirm",
    name: "Sipariş Onay",
    description: "Sipariş oluşturulunca müşteriye gider.",
    subject: "Siparişiniz alındı {{order_number}}",
    heading: "Siparişiniz için teşekkürler!",
    body: "Merhaba {{customer_name}},\n\nSiparişiniz başarıyla alındı. Detayları aşağıda ve hesabınızdaki sipariş sayfasında görebilirsiniz.",
    ctaLabel: "Sipariş Detaylarını Görüntüle",
    ctaUrl: "{{order_url}}",
    category: "order",
    icon: "cart",
    showOrderBox: true,
    isActive: true,
  },
  {
    key: "order_shipped",
    name: "Kargoya Verildi",
    description: "Sipariş kargoya verilince gönderilir.",
    subject: "Siparişiniz kargoya verildi {{order_number}}",
    heading: "Siparişiniz yola çıktı",
    body: "Merhaba {{customer_name}},\n\n{{order_number}} numaralı siparişiniz {{cargo_company}} ile kargoya verildi. Takip numarası: {{tracking_no}}",
    ctaLabel: "Kargoyu Takip Et",
    ctaUrl: "{{tracking_url}}",
    category: "order",
    icon: "truck",
    showOrderBox: true,
    isActive: true,
  },
  {
    key: "order_delivered",
    name: "Teslim Edildi",
    description: "Sipariş teslim edildi olarak işaretlenince gider.",
    subject: "Siparişiniz teslim edildi {{order_number}}",
    heading: "Siparişiniz teslim edildi",
    body: "Merhaba {{customer_name}},\n\n{{order_number}} numaralı siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkürler.",
    ctaLabel: "Siparişi Görüntüle",
    ctaUrl: "{{order_url}}",
    category: "order",
    icon: "package",
    showOrderBox: true,
    isActive: true,
  },
  {
    key: "welcome",
    name: "Hoş Geldiniz",
    description: "Yeni üyelikte gönderilir.",
    subject: "Eser Promo'ya hoş geldiniz",
    heading: "Aramıza hoş geldiniz",
    body: "Merhaba {{customer_name}},\n\nHesabınız oluşturuldu. Promosyon ürünlerimizi keşfetmek için mağazayı ziyaret edebilirsiniz.",
    ctaLabel: "Alışverişe Başla",
    ctaUrl: "{{site_url}}",
    category: "customer",
    icon: "user",
    showOrderBox: false,
    isActive: true,
  },
  {
    key: "password_reset",
    name: "Şifre Sıfırlama",
    description: "Şifremi unuttum talebinde gönderilir.",
    subject: "Şifre yenileme talebiniz",
    heading: "Şifrenizi yenileyin",
    body: "Merhaba {{customer_name}},\n\nŞifre yenileme talebiniz alındı. Bağlantı 30 dakika geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayın.",
    ctaLabel: "Şifreyi Yenile",
    ctaUrl: "{{reset_url}}",
    category: "customer",
    icon: "lock",
    showOrderBox: false,
    isActive: true,
  },
  {
    key: "favorite_discount",
    name: "Favori İndirim",
    description: "Favori ürün indirime girince gider.",
    subject: "Favori ürününüz indirimde",
    heading: "Favoriniz indirimde",
    body: "Merhaba {{customer_name}},\n\n{{product_name}} favorilerinizde ve fiyatı güncellendi: {{price_line}}",
    ctaLabel: "Ürünü Görüntüle",
    ctaUrl: "{{product_url}}",
    category: "customer",
    icon: "tag",
    showOrderBox: false,
    isActive: true,
  },
  {
    key: "cart_reminder",
    name: "Sepet Hatırlatma",
    description: "Otomatik gönderilmez; kampanya için hazır şablon.",
    subject: "Sepetinizde ürünler sizi bekliyor",
    heading: "Sepetiniz sizi bekliyor",
    body: "Merhaba {{customer_name}},\n\nSepetinizde bekleyen ürünler var. Stoklar tükenmeden tamamlamak isterseniz sepetinize dönebilirsiniz.",
    ctaLabel: "Sepete Git",
    ctaUrl: "{{site_url}}/sepet/",
    category: "marketing",
    icon: "bag",
    showOrderBox: false,
    isActive: false,
  },
  {
    key: "support_reply",
    name: "Destek Yanıtı",
    description: "Yönetici destek talebine yanıt yazınca müşteriye gider.",
    subject: "Destek talebiniz yanıtlandı {{ticket_no}}",
    heading: "Destek talebinize yanıt verildi",
    body: "Merhaba {{customer_name}},\n\n{{ticket_no}} numaralı “{{ticket_subject}}” talebinize yanıt:\n\n{{reply_body}}",
    ctaLabel: "Talebi Görüntüle",
    ctaUrl: "{{ticket_url}}",
    category: "other",
    icon: "mail",
    showOrderBox: false,
    isActive: true,
  },
];

export async function ensureEmailTemplates() {
  await Promise.all(
    DEFAULTS.map((item) =>
      prisma.emailTemplate.upsert({
        where: { key: item.key },
        create: item,
        update: {},
      }),
    ),
  );
}

export async function sendTemplateMail(key: string, to: string, vars: EmailVars) {
  await ensureEmailTemplates();
  const template = await prisma.emailTemplate.findUnique({ where: { key } });
  if (!template || !template.isActive) {
    return { sent: false as const, skipped: true as const };
  }
  const merged: EmailVars = {
    site_name: "Eser Promo",
    site_url: siteUrl(),
    support_email: SITE_CONTACT.email,
    support_phone: SITE_CONTACT.phone,
    ...vars,
  };
  const subject = interpolate(template.subject, merged);
  const text = interpolate(`${template.heading}\n\n${template.body}\n\n${template.ctaUrl}`, merged);
  const html = renderEmailHtml({
    heading: template.heading,
    body: template.body,
    ctaLabel: template.ctaLabel,
    ctaUrl: template.ctaUrl,
    showOrderBox: template.showOrderBox,
    vars: merged,
  });
  const ready = await smtpIsReady();
  const result = await sendMail({ to, subject, text, html });
  const status = result.sent ? "success" : ready ? "failure" : "skipped";
  await prisma.emailLog.create({ data: { templateKey: key, to, subject, status } });
  if (result.sent) {
    await prisma.emailTemplate.update({
      where: { key },
      data: { sentCount: { increment: 1 }, lastSentAt: new Date() },
    });
  } else if (ready) {
    await prisma.emailTemplate.update({
      where: { key },
      data: { failCount: { increment: 1 } },
    });
  }
  return { sent: result.sent, skipped: status === "skipped" };
}

function baseVars() {
  return {
    site_name: "Eser Promo",
    site_url: siteUrl(),
    support_email: SITE_CONTACT.email,
    support_phone: SITE_CONTACT.phone,
  };
}

export async function notifyPasswordReset(to: string, token: string) {
  const resetUrl = `${siteUrl()}/sifre-yenile/${token}/`;
  const user = await prisma.user.findUnique({ where: { email: to }, select: { name: true } });
  const result = await sendTemplateMail("password_reset", to, {
    ...baseVars(),
    customer_name: user?.name || "Müşterimiz",
    reset_url: resetUrl,
  });
  return { sent: result.sent, resetUrl };
}

export async function notifyWelcome(to: string, name: string) {
  return sendTemplateMail("welcome", to, { ...baseVars(), customer_name: name });
}

export async function notifyFavoriteDiscountMail(input: {
  to: string;
  name: string;
  productName: string;
  productUrl: string;
  priceLine: string;
  body: string;
}) {
  return sendTemplateMail("favorite_discount", input.to, {
    ...baseVars(),
    customer_name: input.name,
    product_name: input.productName,
    product_url: input.productUrl,
    price_line: input.priceLine,
  });
}

async function orderVars(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!order) return null;
  const company = order.cargoCompany && order.cargoCompany in CARGO_COMPANIES ? CARGO_COMPANIES[order.cargoCompany as CargoCompanyId] : order.cargoCompany;
  const tracking = cargoTrackingUrl(order.cargoCompany, order.trackingNo, order.trackingUrl);
  return {
    order,
    vars: {
      ...baseVars(),
      customer_name: order.shipFullName || order.user.name,
      order_number: order.publicNumber,
      order_total: `₺${formatPriceTry(order.grandTotal)}`,
      order_date: order.createdAt.toLocaleDateString("tr-TR"),
      order_url: `${siteUrl()}/siparislerim/${order.publicNumber}/`,
      tracking_no: order.trackingNo || "—",
      tracking_url: tracking || `${siteUrl()}/siparislerim/${order.publicNumber}/`,
      cargo_company: company || "Kargo",
    } satisfies EmailVars,
  };
}

export async function notifyOrderPlaced(orderId: string) {
  const packed = await orderVars(orderId);
  if (!packed) return { sent: false as const };
  return sendTemplateMail("order_confirm", packed.order.user.email, packed.vars);
}

export async function notifyOrderShipped(orderId: string) {
  const packed = await orderVars(orderId);
  if (!packed) return { sent: false as const };
  return sendTemplateMail("order_shipped", packed.order.user.email, packed.vars);
}

export async function notifyOrderDelivered(orderId: string) {
  const packed = await orderVars(orderId);
  if (!packed) return { sent: false as const };
  return sendTemplateMail("order_delivered", packed.order.user.email, packed.vars);
}

export async function safeNotify(task: Promise<unknown>) {
  try {
    await task;
  } catch (error) {
    console.error("email notify", error);
  }
}
