import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
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

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("Dosya seçin.");
  if (file.size > 2 * 1024 * 1024) return jsonError("Fotoğraf en fazla 2MB olabilir.");

  const ext = ALLOWED[file.type];
  if (!ext) return jsonError("JPG, PNG veya GIF yükleyin.");

  const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.STORAGE_PATH || "./storage");
  const dir = path.join(root, "avatars");
  await mkdir(dir, { recursive: true });
  const relative = `avatars/${user.id}.${ext}`;
  await writeFile(path.join(root, relative), Buffer.from(await file.arrayBuffer()));

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, avatarPath: relative },
    update: { avatarPath: relative },
  });

  return Response.json({ ok: true, url: `/api/media/${relative}` });
}
