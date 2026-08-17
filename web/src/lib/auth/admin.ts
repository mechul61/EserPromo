import { redirect } from "next/navigation";
import { prisma } from "../db";
import { getCurrentUser, type AuthUser } from "./session";
import { normalizeEmail } from "../security/crypto";
import { jsonError } from "../security/origin";

function listedAdminEmails() {
  return (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "")
    .split(/[,;\s]+/)
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
}

export async function promoteIfListed(userId: string, email: string) {
  const listed = listedAdminEmails();
  if (!listed.includes(normalizeEmail(email))) return false;
  await prisma.user.update({ where: { id: userId }, data: { role: "admin" } });
  return true;
}

export async function ensureAdmin(user: AuthUser): Promise<AuthUser | null> {
  if (user.role === "admin") return user;

  if (await promoteIfListed(user.id, user.email)) {
    return { ...user, role: "admin" };
  }

  if (process.env.NODE_ENV !== "production") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount === 0) {
      await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
      return { ...user, role: "admin" };
    }
  }

  return null;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const admin = await ensureAdmin(user);
  if (!admin) redirect("/hesabim");
  return admin;
}

export async function requireAdminApi(): Promise<AuthUser | Response> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);
  const admin = await ensureAdmin(user);
  if (!admin) return jsonError("Yetkisiz.", 403);
  return admin;
}

export function isAdminUser(user: { role: string } | null | undefined) {
  return user?.role === "admin";
}
