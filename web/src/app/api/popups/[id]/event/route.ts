import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/security/origin";

const schema = z.object({
  type: z.enum(["view", "click", "convert"]),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const field = body.data.type === "view" ? "views" : body.data.type === "click" ? "clicks" : "conversions";
  await prisma.popup.updateMany({
    where: { id, isDraft: false },
    data: { [field]: { increment: 1 } },
  });
  return Response.json({ ok: true });
}
