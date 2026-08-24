import { prisma } from "@/lib/db";
import { getSiteContact } from "@/lib/site-settings";
import { siteUrl } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { sendTemplateMail } from "@/lib/commerce/email-templates";
import { normalizeEmail } from "@/lib/security/crypto";
import type { SupportCategoryId, SupportPriorityId } from "@/lib/commerce/support-copy";

export {
  SUPPORT_CATEGORY_LABEL,
  SUPPORT_PRIORITY_LABEL,
  SUPPORT_STATUS_LABEL,
} from "@/lib/commerce/support-copy";
export type { SupportCategoryId, SupportPriorityId, SupportStatusId } from "@/lib/commerce/support-copy";

export async function nextSupportNumber() {
  const year = new Date().getFullYear();
  const prefix = `DSK-${year}-`;
  const last = await prisma.supportTicket.findFirst({
    where: { publicNumber: { startsWith: prefix } },
    orderBy: { publicNumber: "desc" },
    select: { publicNumber: true },
  });
  const n = last ? Number(last.publicNumber.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(Number.isFinite(n) ? n : 1).padStart(4, "0")}`;
}

export async function createSupportTicket(input: {
  userId?: string | null;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  body: string;
  category: SupportCategoryId;
  priority?: SupportPriorityId;
}) {
  const email = normalizeEmail(input.email);
  const publicNumber = await nextSupportNumber();
  const ticket = await prisma.supportTicket.create({
    data: {
      publicNumber,
      userId: input.userId || null,
      name: input.name.trim(),
      email,
      phone: input.phone?.trim() ?? "",
      subject: input.subject.trim(),
      category: input.category,
      priority: input.priority ?? "medium",
      status: "waiting",
      messages: {
        create: {
          author: "customer",
          authorName: input.name.trim(),
          body: input.body.trim(),
        },
      },
    },
  });

  const contact = await getSiteContact();
  await sendMail({
    to: contact.notificationEmail,
    subject: `Yeni destek talebi ${ticket.publicNumber}`,
    text: `${ticket.name} <${ticket.email}>\n${ticket.subject}\n\n${input.body.trim()}\n\n${siteUrl()}/admin/destek/`,
  }).catch(() => null);

  return ticket;
}

export async function addSupportMessage(input: {
  ticketId: string;
  author: "customer" | "admin";
  authorName: string;
  body: string;
}) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: input.ticketId } });
  if (!ticket) throw new Error("Talep bulunamadı");
  if (ticket.status === "archived" || ticket.status === "resolved") {
    throw new Error("Kapalı talebe yanıt eklenemez");
  }

  const message = await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      author: input.author,
      authorName: input.authorName,
      body: input.body.trim(),
    },
  });

  const nextStatus = input.author === "admin" ? "open" : "waiting";
  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { status: nextStatus },
  });

  if (input.author === "admin") {
    await sendTemplateMail("support_reply", ticket.email, {
      customer_name: ticket.name,
      ticket_no: ticket.publicNumber,
      ticket_subject: ticket.subject,
      reply_body: input.body.trim(),
      ticket_url: `${siteUrl()}/hesabim/destek/`,
    }).catch(() => null);
  }

  return message;
}

export async function findOwnedSupportTicket(userId: string, email: string, ticketId: string) {
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      OR: [{ userId }, { email: normalizeEmail(email) }],
    },
  });
  if (ticket && !ticket.userId) {
    await prisma.supportTicket.update({ where: { id: ticket.id }, data: { userId } });
  }
  return ticket;
}
