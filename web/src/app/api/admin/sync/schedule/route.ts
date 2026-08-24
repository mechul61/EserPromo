import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/auth/admin";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";
import {
  decideScheduledRun,
  getSyncSchedule,
  mergeSyncSchedule,
  saveSyncSchedule,
} from "@/lib/etkin/sync-schedule";

export async function GET() {
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;
  const schedule = await getSyncSchedule();
  const decision = decideScheduledRun(schedule);
  return Response.json({
    ok: true,
    schedule,
    nextDecision: decision.run ? { due: true } : { due: false, reason: decision.reason },
  });
}

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const body = await req.json().catch(() => null);
  const current = await getSyncSchedule();
  const merged = mergeSyncSchedule({
    ...current,
    ...(body && typeof body === "object" ? body : {}),
    // Son çalışma zamanını istemci ezmesin
    lastScheduledAt: current.lastScheduledAt,
    lastSkipReason: current.lastSkipReason,
  });
  const schedule = await saveSyncSchedule(merged);
  revalidatePath("/admin/senkron");
  return Response.json({ ok: true, schedule });
}
