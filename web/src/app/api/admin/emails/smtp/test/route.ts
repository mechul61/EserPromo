import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin";
import { sendMail, verifySmtpConnection } from "@/lib/mail";
import { prisma } from "@/lib/db";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import { getCurrentUser } from "@/lib/auth/session";

const schema = z.object({
  to: z.string().trim().email().max(120).optional(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = schema.safeParse(await req.json().catch(() => ({})));
  if (!body.success) return jsonError("Geçerli bir e-posta girin");

  const user = await getCurrentUser();
  const to = body.data.to || user?.email;
  if (!to) return jsonError("Test alıcısı bulunamadı");

  const verify = await verifySmtpConnection();
  if (!verify.ok) {
    await prisma.emailLog.create({
      data: {
        templateKey: "smtp_test",
        to,
        subject: "SMTP bağlantı testi",
        status: "failure",
      },
    });
    return jsonError(verify.error || "SMTP bağlantısı başarısız", 400);
  }

  const result = await sendMail({
    to,
    subject: "Eser Promo — SMTP test maili",
    text: "Bu bir test mesajıdır. SMTP ayarlarınız çalışıyor.",
    html: "<p>Bu bir <strong>test mesajıdır</strong>. SMTP ayarlarınız çalışıyor.</p>",
  });

  await prisma.emailLog.create({
    data: {
      templateKey: "smtp_test",
      to,
      subject: "Eser Promo — SMTP test maili",
      status: result.sent ? "success" : "failure",
    },
  });

  if (!result.sent) {
    return jsonError(result.error || "Test maili gönderilemedi", 400);
  }

  return Response.json({ ok: true, to });
}
