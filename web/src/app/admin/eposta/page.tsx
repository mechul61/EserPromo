import { EmailTemplatesPageView, type EmailKpi, type EmailLogRow, type EmailTemplateRow } from "@/components/admin/EmailTemplatesPageView";
import { ensureEmailTemplates } from "@/lib/commerce/email-templates";
import { EMAIL_CATEGORY_LABEL, EMAIL_LANGUAGE_LABEL, type EmailCategoryId, type EmailLanguageId } from "@/lib/commerce/email-copy";
import { prisma } from "@/lib/db";
import { smtpIsReady } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const metadata = { title: "E-Posta Şablonları | Yönetim" };

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default async function AdminEmailPage() {
  await ensureEmailTemplates();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [templates, monthLogs, prevLogs, smtpReady, recentLogs] = await Promise.all([
    prisma.emailTemplate.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.emailLog.findMany({ where: { createdAt: { gte: monthStart } }, select: { status: true } }),
    prisma.emailLog.findMany({ where: { createdAt: { gte: prevMonthStart, lt: monthStart } }, select: { status: true } }),
    smtpIsReady(),
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const rows: EmailTemplateRow[] = templates.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    subject: row.subject,
    heading: row.heading,
    body: row.body,
    ctaLabel: row.ctaLabel,
    ctaUrl: row.ctaUrl,
    category: row.category as EmailCategoryId,
    categoryLabel: EMAIL_CATEGORY_LABEL[row.category],
    language: row.language as EmailLanguageId,
    languageLabel: EMAIL_LANGUAGE_LABEL[row.language],
    icon: row.icon,
    showOrderBox: row.showOrderBox,
    isActive: row.isActive,
    isSystem: row.isSystem,
    updatedAt: row.updatedAt.toISOString(),
  }));

  const logs: EmailLogRow[] = recentLogs.map((row) => ({
    id: row.id,
    templateKey: row.templateKey,
    to: row.to,
    subject: row.subject,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }));

  const active = rows.filter((row) => row.isActive).length;
  const monthSent = monthLogs.filter((row) => row.status === "success").length;
  const prevSent = prevLogs.filter((row) => row.status === "success").length;
  const monthTried = monthLogs.filter((row) => row.status === "success" || row.status === "failure").length;
  const monthOk = monthLogs.filter((row) => row.status === "success").length;
  const successRate = monthTried === 0 ? 100 : (monthOk / monthTried) * 100;

  const kpis: EmailKpi[] = [
    { label: "Toplam Şablon", value: rows.length.toLocaleString("tr-TR"), color: "bg-[#7c3aed]", icon: "total" },
    { label: "Aktif Şablon", value: active.toLocaleString("tr-TR"), color: "bg-[#22c55e]", icon: "active" },
    { label: "Pasif Şablon", value: (rows.length - active).toLocaleString("tr-TR"), color: "bg-[#f59e0b]", icon: "passive" },
    { label: "Bu Ay Gönderilen", value: monthSent.toLocaleString("tr-TR"), delta: pct(monthSent, prevSent), color: "bg-[#2f6bff]", icon: "sent" },
    { label: "Başarılı Gönderim", value: `%${successRate.toFixed(1).replace(".", ",")}`, color: "bg-[#ec4899]", icon: "success" },
  ];

  return <EmailTemplatesPageView templates={rows} kpis={kpis} smtpReady={smtpReady} initialLogs={logs} />;
}
