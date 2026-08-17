import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, passwordPolicyError } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { recordLoginEvent } from "@/lib/auth/login-events";
import { promoteIfListed } from "@/lib/auth/admin";
import { getOrCreateCart } from "@/lib/commerce/cart";
import { normalizeEmail } from "@/lib/security/crypto";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().trim().max(32).optional(),
  city: z.string().trim().max(40).optional(),
  district: z.string().trim().max(40).optional(),
  line: z.string().trim().max(200).optional(),
  postalCode: z.string().trim().max(10).optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  if (!rateLimit(clientKey(req, "register"), 5, 15 * 60 * 1000)) {
    return jsonError("Çok fazla deneme. Bir süre sonra tekrar deneyin.", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Bilgileri kontrol edin.");

  const policy = passwordPolicyError(body.data.password);
  if (policy) return jsonError(policy);

  const email = normalizeEmail(body.data.email);
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return jsonError("Bu e-posta ile kayıt oluşturulamadı.");

  const user = await prisma.user.create({
    data: {
      email,
      name: body.data.name.trim(),
      passwordHash: await hashPassword(body.data.password),
      phone: body.data.phone?.trim() || null,
      addresses:
        body.data.city && body.data.district && body.data.line
          ? {
              create: {
                title: "Teslimat",
                fullName: body.data.name.trim(),
                email,
                phone: (body.data.phone || "").trim() || "-",
                country: "Türkiye",
                city: body.data.city.trim(),
                district: body.data.district.trim(),
                postalCode: body.data.postalCode?.trim() || "",
                line: body.data.line.trim(),
                isDefault: true,
              },
            }
          : undefined,
    },
  });

  await createSession(user.id);
  await recordLoginEvent(user.id, email, req, "register");
  await getOrCreateCart();
  const promoted = await promoteIfListed(user.id, email);
  return Response.json({ ok: true, role: promoted ? "admin" : "customer" });
}
