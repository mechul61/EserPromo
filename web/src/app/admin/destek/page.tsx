import { SupportPageView, type SupportKpi, type SupportTicketRow } from "@/components/admin/SupportPageView";
import { prisma } from "@/lib/db";
import {
  SUPPORT_CATEGORY_LABEL,
  SUPPORT_PRIORITY_LABEL,
  SUPPORT_STATUS_LABEL,
  type SupportCategoryId,
  type SupportPriorityId,
  type SupportStatusId,
} from "@/lib/commerce/support-copy";

function currentTimestamp() { return Date.now(); }

export const dynamic = "force-dynamic";
export const metadata = { title: "Destek Talepleri | Yönetim" };

export default async function AdminSupportPage() {
  const since = new Date(currentTimestamp() - 30 * 24 * 60 * 60 * 1000);
  const [tickets, rated] = await Promise.all([
    prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.supportTicket.findMany({
      where: { rating: { not: null }, resolvedAt: { gte: since } },
      select: { rating: true },
    }),
  ]);

  const rows: SupportTicketRow[] = tickets.map((row) => ({
    id: row.id,
    publicNumber: row.publicNumber,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    category: row.category as SupportCategoryId,
    categoryLabel: SUPPORT_CATEGORY_LABEL[row.category],
    priority: row.priority as SupportPriorityId,
    priorityLabel: SUPPORT_PRIORITY_LABEL[row.priority],
    status: row.status as SupportStatusId,
    statusLabel: SUPPORT_STATUS_LABEL[row.status],
    rating: row.rating,
    createdAt: row.createdAt.toISOString(),
    messages: row.messages.map((item) => ({
      id: item.id,
      author: item.author,
      authorName: item.authorName,
      body: item.body,
      createdAt: item.createdAt.toISOString(),
    })),
  }));

  const open = rows.filter((row) => row.status === "open" || row.status === "waiting").length;
  const waiting = rows.filter((row) => row.status === "waiting").length;
  const resolved = rows.filter((row) => row.status === "resolved").length;
  const happy = rated.filter((row) => (row.rating ?? 0) >= 4).length;
  const satisfaction = rated.length ? Math.round((happy / rated.length) * 100) : null;

  const kpis: SupportKpi[] = [
    { label: "Toplam Talep", value: rows.length.toLocaleString("tr-TR"), hint: "Tüm zamanlar", color: "bg-[#2f6bff]", icon: "total" },
    { label: "Açık Talepler", value: open.toLocaleString("tr-TR"), hint: "Yanıt bekleyen", color: "bg-[#22c55e]", icon: "open" },
    { label: "Yanıt Bekleyen", value: waiting.toLocaleString("tr-TR"), hint: "Sizin yanıtınız bekleniyor", color: "bg-[#f59e0b]", icon: "waiting" },
    { label: "Çözülen Talepler", value: resolved.toLocaleString("tr-TR"), hint: "Tüm zamanlar", color: "bg-[#7c3aed]", icon: "resolved" },
    { label: "Memnuniyet Oranı", value: satisfaction == null ? "—" : `%${satisfaction}`, hint: "Son 30 gün", color: "bg-[#14b8a6]", icon: "rate" },
  ];

  return <SupportPageView tickets={rows} kpis={kpis} />;
}
