import { NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdminApi } from "@/lib/auth/admin";
import { randomToken } from "@/lib/security/crypto";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }
  const admin = await requireAdminApi();
  if (admin instanceof Response) return admin;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("Dosya seçin");
  if (file.size > 8 * 1024 * 1024) return jsonError("Görsel en fazla 8MB olabilir");
  const ext = ALLOWED[file.type];
  if (!ext) return jsonError("JPG, PNG, WEBP veya GIF yükleyin");

  const root = path.resolve(process.cwd(), process.env.STORAGE_PATH || "./storage");
  const dir = path.join(root, "popups");
  await mkdir(dir, { recursive: true });
  const relative = `popups/${randomToken(8)}.${ext}`;
  await writeFile(path.join(root, relative), Buffer.from(await file.arrayBuffer()));
  return Response.json({ ok: true, path: relative, url: `/api/media/${relative}` });
}
