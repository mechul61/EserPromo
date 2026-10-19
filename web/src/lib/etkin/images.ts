import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
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

type RemoteStamp = {
  etag: string | null;
  lastModified: string | null;
  contentLength: number | null;
};

type StoredStamp = {
  etag: string | null;
  lastModified: string | null;
  sha256: string;
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

function stampPath(absolute: string) {
  return `${absolute}.sig`;
}

async function fileSha256(filePath: string) {
  const hash = createHash("sha256");
  await pipeline(createReadStream(filePath), hash);
  return hash.digest("hex");
}

async function readStamp(absolute: string): Promise<StoredStamp | null> {
  try {
    const raw = await readFile(stampPath(absolute), "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredStamp>;
    if (!parsed.sha256) return null;
    return {
      etag: parsed.etag ?? null,
      lastModified: parsed.lastModified ?? null,
      sha256: parsed.sha256,
    };
  } catch {
    return null;
  }
}

async function writeStamp(absolute: string, stamp: StoredStamp) {
  await writeFile(stampPath(absolute), JSON.stringify(stamp));
}

async function remoteStamp(url: string, userAgent: string): Promise<RemoteStamp | null> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": userAgent, Accept: "image/*,*/*" },
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const length = Number(res.headers.get("content-length"));
    return {
      etag: res.headers.get("etag"),
      lastModified: res.headers.get("last-modified"),
      contentLength: Number.isFinite(length) && length > 0 ? length : null,
    };
  } catch {
    return null;
  }
}

/**
 * Görseli yerel storage'a indirir (hotlink yok).
 * refresh açıksa karar dosya adına bakmaz: uzak ETag / Last-Modified
 * değişmişse indirir, içerik özeti farklıysa üzerine yazar.
 */
export async function downloadToStorage(options: {
  url: string;
  storageRoot: string;
  relativeDir: string;
  fileName: string;
  userAgent: string;
  refresh?: boolean;
  /** Tam senkron: etiket aynı olsa da yeniden indir, eskisini yenisi yazılınca sil. */
  force?: boolean;
  /** İçerik değişince dosya adı değişsin, tarayıcı eski görseli tutmasın. */
  versioned?: boolean;
  existingRelativePath?: string | null;
  urlChanged?: boolean;
}): Promise<DownloadResult> {
  const dir = path.resolve(options.storageRoot, options.relativeDir);
  await mkdir(dir, { recursive: true });
  const slot = path.basename(options.fileName, path.extname(options.fileName));
  const existingName = options.existingRelativePath
    ? path.basename(options.existingRelativePath)
    : options.fileName;
  const absolute = path.join(dir, existingName);
  const localPath = path.join(options.relativeDir, existingName).replace(/\\/g, "/");

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

  const remote =
    localSize > 0 && options.refresh && !options.force
      ? await remoteStamp(options.url, options.userAgent)
      : null;
  if (localSize > 0 && options.refresh && !options.force && !options.urlChanged && remote) {
    const stored = await readStamp(absolute);
    const etagSame = Boolean(remote.etag && stored?.etag && remote.etag === stored.etag);
    const dateSame =
      !remote.etag &&
      Boolean(
        remote.lastModified &&
          stored?.lastModified &&
          remote.lastModified === stored.lastModified &&
          remote.contentLength != null &&
          remote.contentLength === localSize,
      );
    if (etagSame || dateSame) {
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

    const nextHash = await fileSha256(tempPath);
    const stamp: StoredStamp = {
      etag: res.headers.get("etag") || remote?.etag || null,
      lastModified: res.headers.get("last-modified") || remote?.lastModified || null,
      sha256: nextHash,
    };

    const ext = extFromUrl(options.url);
    const finalName = options.versioned ? `${slot}-${nextHash.slice(0, 12)}${ext}` : options.fileName;
    const finalAbsolute = path.join(dir, finalName);
    const finalPath = path.join(options.relativeDir, finalName).replace(/\\/g, "/");

    if (options.versioned && localSize > 0 && !options.urlChanged && existingName === finalName) {
      await unlink(tempPath).catch(() => undefined);
      await writeStamp(finalAbsolute, stamp);
      await removeOtherSlotFiles(dir, slot, finalName);
      return { ok: true, localPath: finalPath, byteSize: localSize, updated: false };
    }
    if (!options.versioned && localSize > 0 && !options.urlChanged && !options.force) {
      const previousHash = await fileSha256(absolute);
      if (previousHash === nextHash) {
        await unlink(tempPath).catch(() => undefined);
        await writeStamp(absolute, stamp);
        return { ok: true, localPath, byteSize: localSize, updated: false };
      }
    }

    if (finalAbsolute !== tempPath) {
      await unlink(finalAbsolute).catch(() => undefined);
    }
    await rename(tempPath, finalAbsolute);
    await writeStamp(finalAbsolute, stamp);
    if (options.versioned) await removeOtherSlotFiles(dir, slot, finalName);
    else if (absolute !== finalAbsolute) await unlink(absolute).catch(() => undefined);
    return {
      ok: true,
      localPath: finalPath,
      byteSize: info.size,
      updated: true,
    };
  } catch (error) {
    await unlink(tempPath).catch(() => undefined);
    return {
      ok: false,
      localPath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function removeOtherSlotFiles(dir: string, slot: string, keepName: string) {
  const re = new RegExp(`^${slot}(-[0-9a-f]{12})?\\.[a-z0-9]{1,5}(\\.sig|\\.part)?$`, "i");
  let names: string[] = [];
  try {
    names = await readdir(dir);
  } catch {
    return;
  }
  await Promise.all(
    names.map(async (name) => {
      if (name === keepName || name === `${keepName}.sig`) return;
      if (!re.test(name)) return;
      await unlink(path.join(dir, name)).catch(() => undefined);
    }),
  );
}

export function imageFileName(sortOrder: number, url: string): string {
  return `resim${sortOrder}${extFromUrl(url)}`;
}
