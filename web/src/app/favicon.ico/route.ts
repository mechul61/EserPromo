import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function storageRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.STORAGE_PATH || "./storage");
}

export async function GET() {
  const settings = await getSiteSettings();
  const relative = settings.general.faviconUrl.replace(/^[/\\]+/, "").replace(/\\/g, "/");
  const root = storageRoot();

  if (relative && !relative.split("/").includes("..")) {
    const absolute = path.resolve(/*turbopackIgnore: true*/ root, relative);
    if (absolute.startsWith(root)) {
      try {
        const info = await stat(absolute);
        if (info.isFile()) {
          const body = await readFile(absolute);
          const ext = path.extname(absolute).toLowerCase();
          return new Response(body, {
            headers: {
              "Content-Type": MIME[ext] || "image/png",
              "Content-Length": String(body.byteLength),
              "Cache-Control": "public, max-age=300",
            },
          });
        }
      } catch {
        /* varsayılan ikona düş */
      }
    }
  }

  const fallback = path.join(process.cwd(), "public", "brand", "favicon.ico");
  const body = await readFile(fallback);
  return new Response(body, {
    headers: {
      "Content-Type": "image/x-icon",
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=300",
    },
  });
}
