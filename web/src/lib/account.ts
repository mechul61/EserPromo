import { prisma } from "./db";
import { formatPriceTry, mediaUrl } from "./media";
import { formatPhoneTR } from "./phone";
import { formatDateTimeTr } from "./auth/login-meta";

export function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] ?? "" };
}

export function formatDateTr(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("tr-TR");
}

export async function listAccountNotifications(userId: string) {
  return prisma.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function getAccountOverview(userId: string) {
  const [user, orders, lastSession, lastLoginEvent] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    }),
    prisma.order.aggregate({
      where: { userId, status: { notIn: ["cancelled", "failed"] } },
      _count: true,
      _sum: { grandTotal: true },
    }),
    prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.loginEvent.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const names = user.profile
    ? { firstName: user.profile.firstName, lastName: user.profile.lastName }
    : splitName(user.name);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: formatPhoneTR(user.phone ?? ""),
      createdAt: user.createdAt,
    },
    profile: {
      firstName: names.firstName,
      lastName: names.lastName,
      birthDate: user.profile?.birthDate ? user.profile.birthDate.toISOString().slice(0, 10) : "",
      gender: user.profile?.gender ?? "",
      avatarUrl: mediaUrl(user.profile?.avatarPath) ?? "",
      companyName: user.profile?.companyName ?? "",
      companyTitle: user.profile?.companyTitle ?? "",
      taxOffice: user.profile?.taxOffice ?? "",
      taxNumber: user.profile?.taxNumber ?? "",
      tcKimlik: user.profile?.tcKimlik ?? "",
      useCorporateDefault: user.profile?.useCorporateDefault ?? false,
      notifyEmail: user.profile?.notifyEmail ?? true,
      notifySms: user.profile?.notifySms ?? false,
      notifyWhatsapp: user.profile?.notifyWhatsapp ?? false,
      notifyOrder: user.profile?.notifyOrder ?? true,
    },
    stats: {
      orderCount: orders._count,
      spent: formatPriceTry(Number(orders._sum.grandTotal ?? 0)),
      memberSince: formatDateTr(user.createdAt),
      lastLogin: formatDateTimeTr(lastLoginEvent?.createdAt ?? lastSession?.createdAt ?? user.createdAt),
    },
  };
}
