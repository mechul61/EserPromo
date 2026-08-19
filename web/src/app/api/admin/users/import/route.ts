import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/auth/password";
import { splitName } from "@/lib/account";
import { customerWriteSchema, parseCustomerGroup, parseCustomerSource } from "@/lib/admin/customer-input";
import { prisma } from "@/lib/db";
import { randomToken, normalizeEmail } from "@/lib/security/crypto";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { phoneDigits } from "@/lib/phone";

const bodySchema = z.object({
  items: z.array(customerWriteSchema).min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Müşteri listesi gerekli");

  let created = 0;
  let updated = 0;
  let failed = 0;
  for (const item of body.data.items) {
    try {
      const email = normalizeEmail(item.email);
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      const names = splitName(item.name);
      const data = {
        name: item.name.trim(),
        phone: item.phone ? phoneDigits(item.phone) : null,
        city: item.city?.trim() || "",
        customerGroup: parseCustomerGroup(item.customerGroup),
        source: parseCustomerSource(item.source),
        isActive: item.isActive ?? true,
        blocked: item.blocked ?? false,
      };
      if (existing) {
        await prisma.user.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.user.create({
          data: {
            email,
            passwordHash: await hashPassword(`Ep1!${randomToken(6)}`),
            role: "customer",
            ...data,
            profile: { create: { firstName: names.firstName, lastName: names.lastName } },
          },
        });
        created += 1;
      }
    } catch {
      failed += 1;
    }
  }

  revalidatePath("/admin/musteriler");
  return Response.json({ ok: true, created, updated, failed });
}
