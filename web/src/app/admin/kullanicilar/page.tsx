import { StaffUsersPageView, type StaffActivity, type StaffKpi, type StaffSessionRow, type StaffUserRow } from "@/components/admin/StaffUsersPageView";
import { ensureListedSuperAdmins, requireAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import {
  STAFF_ROLE_LABEL,
  canManageStaff,
  isStaffRole,
  usernameFromEmail,
  type StaffRoleId,
} from "@/lib/admin/staff-copy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kullanıcılar | Yönetim" };

export default async function AdminStaffPage() {
  const me = await requireAdmin();
  await ensureListedSuperAdmins();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const [users, activities, sessions] = await Promise.all([
    prisma.user.findMany({
      where: { role: { not: "customer" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        blocked: true,
        emailVerifiedAt: true,
        createdAt: true,
        loginEvents: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
        sessions: {
          where: { expiresAt: { gt: now } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    prisma.loginEvent.findMany({
      where: { user: { role: { not: "customer" } } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        source: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
    prisma.session.findMany({
      where: { expiresAt: { gt: now }, user: { role: { not: "customer" } } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        userId: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const rows: StaffUserRow[] = users.map((row) => {
    const role: StaffRoleId = isStaffRole(row.role) ? row.role : "admin";
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      username: usernameFromEmail(row.email),
      role,
      roleLabel: STAFF_ROLE_LABEL[role],
      isActive: row.isActive && !row.blocked,
      emailVerified: Boolean(row.emailVerifiedAt),
      createdAt: row.createdAt.toISOString(),
      lastLoginAt: (row.loginEvents[0]?.createdAt ?? row.sessions[0]?.createdAt)?.toISOString() ?? null,
    };
  });

  const active = rows.filter((row) => row.isActive).length;
  const managerCount = rows.filter((row) => row.role === "admin" || row.role === "super_admin").length;
  const recent = rows.filter((row) => new Date(row.createdAt) >= since).length;

  const kpis: StaffKpi[] = [
    { label: "Toplam Kullanıcı", value: rows.length.toLocaleString("tr-TR"), color: "bg-[#7c3aed]", icon: "total" },
    { label: "Aktif Kullanıcı", value: active.toLocaleString("tr-TR"), color: "bg-[#22c55e]", icon: "active" },
    { label: "Pasif Kullanıcı", value: (rows.length - active).toLocaleString("tr-TR"), color: "bg-[#f59e0b]", icon: "passive" },
    { label: "Yönetici", value: managerCount.toLocaleString("tr-TR"), color: "bg-[#2f6bff]", icon: "admin" },
    { label: "Son 30 Gün Yeni", value: recent.toLocaleString("tr-TR"), color: "bg-[#ef4444]", icon: "recent" },
  ];

  const activityRows: StaffActivity[] = activities.map((item) => ({
    id: item.id,
    text: item.source === "register" ? `${item.user.name} kayıt oldu` : `${item.user.name} giriş yaptı`,
    at: item.createdAt.toISOString(),
  }));

  const sessionRows: StaffSessionRow[] = sessions.map((item) => ({
    id: item.id,
    userId: item.userId,
    name: item.user.name,
    email: item.user.email,
    createdAt: item.createdAt.toISOString(),
    expiresAt: item.expiresAt.toISOString(),
  }));

  return (
    <StaffUsersPageView
      currentUserId={me.id}
      currentRole={me.role}
      canManage={canManageStaff(me.role)}
      users={rows}
      kpis={kpis}
      activities={activityRows}
      sessions={sessionRows}
    />
  );
}
