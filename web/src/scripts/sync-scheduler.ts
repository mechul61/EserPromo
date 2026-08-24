/**
 * Otomatik senkron tetikleyicisi.
 * PM2 cron / sistem cron ile sık (örn. her 5–15 dk) çalıştırın;
 * gerçek iş, paneldeki aralık + sessiz saat kurallarına göre yapılır.
 *
 *   npm run sync:scheduler
 *   npm run sync:scheduler -- --force
 */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const force = process.argv.includes("--force");
  const { runScheduledSyncIfDue } = await import("../lib/etkin/sync-schedule");
  const out = await runScheduledSyncIfDue({ force });

  if (out.skipped) {
    console.log(`[sync-scheduler] atlandı: ${out.reason}`);
    return;
  }

  console.log(
    `[sync-scheduler] çalıştı: ${out.schedule.jobType}`,
    JSON.stringify(out.result ?? {}),
  );
}

main().catch((err) => {
  console.error("[sync-scheduler] hata:", err);
  process.exit(1);
});
