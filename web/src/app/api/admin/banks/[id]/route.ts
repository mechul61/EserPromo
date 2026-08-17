import { NextRequest } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { getTurkeyBank } from "@/data/turkey-banks";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const schema = z.object({
  enabled: z.boolean().optional(),
  displayName: z.string().trim().max(80).optional(),
  holderName: z.string().trim().max(120).optional(),
  iban: z.string().trim().max(42).optional(),
  accountType: z.string().trim().max(40).optional(),
});

function revalidateBanks() {
  revalidatePath("/odeme");
  revalidatePath("/admin/bankalar");
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const id = (await ctx.params).id;
  if (!getTurkeyBank(id)) return jsonError("Banka bulunamadı", 404);

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const data: {
    enabled?: boolean;
    displayName?: string;
    holderName?: string;
    iban?: string;
    accountType?: string;
  } = {};
  if (typeof body.data.enabled === "boolean") data.enabled = body.data.enabled;
  if (body.data.displayName !== undefined) data.displayName = body.data.displayName;
  if (body.data.holderName !== undefined) data.holderName = body.data.holderName.toLocaleUpperCase("tr");
  if (body.data.iban !== undefined) {
    data.iban = body.data.iban.replace(/\s+/g, "").toUpperCase();
    if (data.iban && !/^TR[0-9]{24}$/.test(data.iban)) {
      return jsonError("Geçerli bir TR IBAN girin (26 karakter).");
    }
  }
  if (body.data.accountType !== undefined) data.accountType = body.data.accountType;

  const existing = await prisma.transferBank.findUnique({ where: { id } });
  await prisma.transferBank.upsert({
    where: { id },
    create: {
      id,
      enabled: data.enabled ?? true,
      displayName: data.displayName ?? "",
      holderName: data.holderName ?? "",
      iban: data.iban ?? "",
      accountType: data.accountType ?? "Vadesiz TL",
    },
    update: data,
  });
  revalidateBanks();
  revalidatePath(`/admin/bankalar/${id}`);
  return Response.json({ ok: true, enabled: data.enabled ?? existing?.enabled ?? true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const id = (await ctx.params).id;
  if (!getTurkeyBank(id)) return jsonError("Banka bulunamadı", 404);

  await prisma.transferBank.deleteMany({ where: { id } });
  revalidateBanks();
  revalidatePath(`/admin/bankalar/${id}`);
  return Response.json({ ok: true });
}
