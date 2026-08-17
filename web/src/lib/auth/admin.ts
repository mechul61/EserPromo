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

export function isAdminUser(user: { role: string } | null | undefined) {
  return user?.role === "admin";
}

/** Sadece login/kayıt sırasında, ADMIN_EMAIL listesindeki hesaplar için. */
export async function promoteIfListed(userId: string, email: string) {
  const listed = listedAdminEmails();
  if (!listed.includes(normalizeEmail(email))) return false;
  await prisma.user.update({ where: { id: userId }, data: { role: "admin" } });
  return true;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  if (!isAdminUser(user)) redirect("/hesabim");
  return user;
}

export async function requireAdminApi(): Promise<AuthUser | Response> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);
  if (!isAdminUser(user)) return jsonError("Yetkisiz.", 403);
  return user;
}
