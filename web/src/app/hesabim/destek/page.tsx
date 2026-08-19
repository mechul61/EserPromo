import { redirect } from "next/navigation";
import { AccountChrome } from "@/components/account/AccountChrome";
import { SupportTicketsView, type AccountSupportTicket } from "@/components/account/SupportTicketsView";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { SupportCategoryId, SupportStatusId } from "@/lib/commerce/support-copy";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Destek Taleplerim",
  robots: { index: false, follow: false },
};

export default async function AccountSupportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");

  const rows = await prisma.supportTicket.findMany({
    where: {
      OR: [{ userId: user.id }, { email: user.email }],
    },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const tickets: AccountSupportTicket[] = rows.map((row) => ({
    id: row.id,
    publicNumber: row.publicNumber,
    subject: row.subject,
    category: row.category as SupportCategoryId,
    status: row.status as SupportStatusId,
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

  return (
    <AccountChrome
      title="Destek Taleplerim"
      subtitle="Destek taleplerinizi görüntüleyin, yanıtlayın ve yeni talep açın."
      crumbs={[
        { href: "/", label: "Ana Sayfa" },
        { href: "/hesabim", label: "Hesabım" },
        { label: "Destek Taleplerim" },
      ]}
    >
      <SupportTicketsView tickets={tickets} />
    </AccountChrome>
  );
}
