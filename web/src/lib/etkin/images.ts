import { createWriteStream } from "node:fs";
import { mkdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export type DownloadResult = {
  ok: boolean;
  localPath: string;
  byteSize?: number;
  /** Uzak görsel indirilip diske yazıldı. */
  updated?: boolean;
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

async function remoteContentLength(url: string, userAgent: string) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": userAgent, Accept: "image/*,*/*" },
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const length = Number(res.headers.get("content-length"));
    return Number.isFinite(length) && length > 0 ? length : null;
  } catch {
    return null;
  }
}

/**
 * Görseli yerel storage'a indirir (hotlink yok).
 * refresh açıksa adres değiştiyse veya uzak dosya boyutu farklıysa üzerine yazar.
 */
export async function downloadToStorage(options: {
  url: string;
  storageRoot: string;
  relativeDir: string;
  fileName: string;
  userAgent: string;
  refresh?: boolean;
  urlChanged?: boolean;
}): Promise<DownloadResult> {
  const dir = path.resolve(options.storageRoot, options.relativeDir);
  await mkdir(dir, { recursive: true });
  const absolute = path.join(dir, options.fileName);
  const localPath = path
    .join(options.relativeDir, options.fileName)
    .replace(/\\/g, "/");

  let localSize = 0;
  try {
    const existing = await stat(absolute);
    if (existing.isFile() && existing.size > 0) localSize = existing.size;
  } catch {
    localSize = 0;
  }

  if (localSize > 0 && !options.refresh) {
    return { ok: true, localPath, byteSize: localSize, updated: false };
  }

  if (localSize > 0 && options.refresh && !options.urlChanged) {
    const remoteSize = await remoteContentLength(options.url, options.userAgent);
    if (remoteSize != null && remoteSize === localSize) {
      return { ok: true, localPath, byteSize: localSize, updated: false };
    }
  }

  const tempPath = `${absolute}.part`;
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
    await pipeline(nodeStream, createWriteStream(tempPath));
    const info = await stat(tempPath);
    if (info.size <= 0) {
      await unlink(tempPath).catch(() => undefined);
      return { ok: false, localPath, error: "Boş dosya" };
    }
    if (localSize > 0 && info.size === localSize && !options.urlChanged) {
      await unlink(tempPath).catch(() => undefined);
      return { ok: true, localPath, byteSize: localSize, updated: false };
    }
    await unlink(absolute).catch(() => undefined);
    await rename(tempPath, absolute);
    return { ok: true, localPath, byteSize: info.size, updated: true };
  } catch (error) {
    await unlink(tempPath).catch(() => undefined);
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
