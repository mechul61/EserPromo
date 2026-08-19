import { NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdminApi } from "@/lib/auth/admin";
import { randomToken } from "@/lib/security/crypto";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
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
  const kind = String(form?.get("kind") || "logo");
  if (!(file instanceof File)) return jsonError("Dosya seçin");
  if (file.size > 4 * 1024 * 1024) return jsonError("Dosya en fazla 4MB olabilir");
  const ext = ALLOWED[file.type];
  if (!ext) return jsonError("PNG, JPG, SVG veya ICO yükleyin");
  if (kind === "favicon" && !["png", "svg", "ico"].includes(ext)) {
    return jsonError("Favicon için PNG, SVG veya ICO kullanın");
  }

  const root = path.resolve(process.cwd(), process.env.STORAGE_PATH || "./storage");
  const dir = path.join(root, "site");
  await mkdir(dir, { recursive: true });
  const relative = `site/${kind}-${randomToken(8)}.${ext}`;
  await writeFile(path.join(root, relative), Buffer.from(await file.arrayBuffer()));
  return Response.json({ ok: true, path: relative, url: `/api/media/${relative}` });
}
