import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export type DownloadResult = {
  ok: boolean;
  localPath: string;
  byteSize?: number;
  error?: string;
};

function extFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname;
    const ext = path.extname(p).toLowerCase();
    if (ext && ext.length <= 5) return ext;
  } catch {
    /* ignore */
  }
  return ".jpg";
}

/**
 * Görseli yerel storage'a indirir (hotlink yok).
 * Aynı dosya varsa ve boyut > 0 ise tekrar indirmez.
 */
export async function downloadToStorage(options: {
  url: string;
  storageRoot: string;
  relativeDir: string;
  fileName: string;
  userAgent: string;
}): Promise<DownloadResult> {
  const dir = path.resolve(options.storageRoot, options.relativeDir);
  await mkdir(dir, { recursive: true });
  const absolute = path.join(dir, options.fileName);
  const localPath = path
    .join(options.relativeDir, options.fileName)
    .replace(/\\/g, "/");

  try {
    const existing = await stat(absolute);
    if (existing.isFile() && existing.size > 0) {
      return { ok: true, localPath, byteSize: existing.size };
    }
  } catch {
    /* yok */
  }

  try {
    const res = await fetch(options.url, {
      headers: { "User-Agent": options.userAgent, Accept: "image/*,*/*" },
      signal: AbortSignal.timeout(60_000),
      redirect: "follow",
    });
    if (!res.ok || !res.body) {
      return {
        ok: false,
        localPath,
        error: `HTTP ${res.status}`,
      };
    }

    const nodeStream = Readable.fromWeb(res.body as import("stream/web").ReadableStream);
    await pipeline(nodeStream, createWriteStream(absolute));
    const info = await stat(absolute);
    return { ok: true, localPath, byteSize: info.size };
  } catch (error) {
    return {
      ok: false,
      localPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function imageFileName(sortOrder: number, url: string): string {
  return `resim${sortOrder}${extFromUrl(url)}`;
}
