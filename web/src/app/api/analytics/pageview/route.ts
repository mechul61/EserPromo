import { NextRequest } from "next/server";
import { z } from "zod";
import { recordPageView } from "@/lib/analytics";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { jsonError } from "@/lib/security/origin";

const schema = z.object({
  vid: z.string().trim().min(8).max(80),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(clientKey(req, "analytics-pageview"), 120, 60_000)) {
    return jsonError("Çok fazla istek", 429);
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ ok: false }, { status: 400 });

  try {
    await recordPageView(body.data.vid);
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
