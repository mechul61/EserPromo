import { NextRequest } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  await destroySession();
  return Response.json({ ok: true });
}
