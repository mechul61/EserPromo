import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { splitName } from "@/lib/account";
import { customerWriteSchema, parseCustomerGroup, parseCustomerSource } from "@/lib/admin/customer-input";
import { prisma } from "@/lib/db";
import { randomToken, normalizeEmail } from "@/lib/security/crypto";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { isValidTRPhone, phoneDigits } from "@/lib/phone";

function generatedPassword() {
  return `Ep1!${randomToken(6)}`;
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = customerWriteSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Ad ve e-posta gerekli");

  const email = normalizeEmail(body.data.email);
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return jsonError("Bu e-posta zaten kayıtlı");

  const password = body.data.password?.trim() || generatedPassword();
  const policy = passwordPolicyError(password);
  if (policy) return jsonError(policy);

  const phoneRaw = body.data.phone?.trim() || "";
  if (phoneRaw && !isValidTRPhone(phoneRaw)) return jsonError("Telefon numarasını kontrol edin");
  const names = splitName(body.data.name);

  const user = await prisma.user.create({
    data: {
      email,
      name: body.data.name.trim(),
      passwordHash: await hashPassword(password),
      phone: phoneRaw ? phoneDigits(phoneRaw) : null,
      city: body.data.city?.trim() || "",
      customerGroup: parseCustomerGroup(body.data.customerGroup),
      source: parseCustomerSource(body.data.source),
      isActive: body.data.isActive ?? true,
      blocked: body.data.blocked ?? false,
      role: "customer",
      profile: {
        create: {
          firstName: names.firstName,
          lastName: names.lastName,
        },
      },
    },
    select: { id: true, publicNo: true, email: true },
  });

  revalidatePath("/admin/musteriler");
  return Response.json({
    ok: true,
    id: user.id,
    publicNo: user.publicNo,
    email: user.email,
    password: body.data.password ? undefined : password,
  });
}
