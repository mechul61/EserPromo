import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

function storageRoot() {
  return path.resolve(process.cwd(), process.env.STORAGE_PATH || "./storage");
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const parts = (await context.params).path ?? [];
  if (!parts.length) {
    return new Response("Not found", { status: 404 });
  }

  // Path traversal koruması
  if (parts.some((p) => p === ".." || p.includes("\0"))) {
    return new Response("Forbidden", { status: 403 });
  }

  const root = storageRoot();
  const absolute = path.resolve(root, ...parts);
  if (!absolute.startsWith(root)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const info = await stat(absolute);
    if (!info.isFile()) {
      return new Response("Not found", { status: 404 });
    }

    const ext = path.extname(absolute).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    const stream = Readable.toWeb(createReadStream(absolute));

    return new Response(stream as BodyInit, {
      headers: {
        "Content-Type": type,
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
