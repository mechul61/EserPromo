import { z } from "zod";

const catalogSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_URL: z.string().url().default("https://www.birikimpromosyon.com/api/json/"),
  API_HASH: z.string().min(1),
  EBAYI_EPOSTA: z.string().email().or(z.string().min(3)),
  SITE_DOMAIN: z.string().min(1),
  STORAGE_PATH: z.string().default("./storage"),
  SYNC_MIN_INTERVAL_MS: z.coerce.number().default(60 * 60 * 1000),
  SYNC_REQUEST_GAP_MS: z.coerce.number().default(500),
});

const appSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(32),
  STORAGE_PATH: z.string().default("./storage"),
  IYZICO_URI: z.string().optional(),
  IYZICO_API_KEY: z.string().optional(),
  IYZICO_SECRET_KEY: z.string().optional(),
});

export type CatalogEnv = z.infer<typeof catalogSchema>;
export type AppEnv = z.infer<typeof appSchema>;

/** Sync / Etkin client — API sırları. Sayfa render'ında çağırma. */
export function getEnv(): CatalogEnv {
  const parsed = catalogSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Env hatası: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function getAppEnv(): AppEnv {
  const parsed = appSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Uygulama env hatası: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function iyzicoReady(): boolean {
  return Boolean(
    process.env.IYZICO_URI &&
      process.env.IYZICO_API_KEY &&
      process.env.IYZICO_SECRET_KEY,
  );
}
