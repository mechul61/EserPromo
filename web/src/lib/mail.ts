import { prisma } from "@/lib/db";
import { getSiteContact } from "@/lib/site-settings";

const SMTP_KEYS = ["smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFrom"] as const;

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

export function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(Math.min(12, value.length - 4))}`;
}

export async function getSmtpConfig(): Promise<SmtpConfig> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: [...SMTP_KEYS] } } });
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    host: (map.smtpHost || process.env.SMTP_HOST || "").trim(),
    port: Number(map.smtpPort || process.env.SMTP_PORT || 587),
    user: (map.smtpUser || process.env.SMTP_USER || "").trim(),
    pass: (map.smtpPass || process.env.SMTP_PASS || "").trim(),
    from: (map.smtpFrom || process.env.SMTP_FROM || (await getSiteContact()).email).trim(),
  };
}

export function smtpConfigReady(config: SmtpConfig) {
  return Boolean(config.host && config.user && config.pass);
}

export async function smtpIsReady() {
  return smtpConfigReady(await getSmtpConfig());
}

export function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function setSmtpConfig(input: {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  from?: string;
}) {
  const current = await getSmtpConfig();
  const next = {
    smtpHost: (input.host ?? current.host).trim(),
    smtpPort: String(input.port ?? current.port),
    smtpUser: (input.user ?? current.user).trim(),
    smtpPass: input.pass && !input.pass.includes("•") ? input.pass.trim() : current.pass,
    smtpFrom: (input.from ?? current.from).trim() || (await getSiteContact()).email,
  };
  await Promise.all(
    Object.entries(next).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
  return next;
}

export async function sendMail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const config = await getSmtpConfig();
  if (!smtpConfigReady(config)) return { sent: false as const };

  try {
    const { createTransport } = await import("nodemailer");
    const transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
    await transporter.sendMail({
      from: `Eser Promo <${config.from}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<p>${input.text.replaceAll("\n", "<br/>")}</p>`,
    });
    return { sent: true as const };
  } catch (error) {
    console.error("mail send", error);
    return { sent: false as const };
  }
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const { notifyPasswordReset } = await import("./commerce/email-templates");
  return notifyPasswordReset(to, token);
}
