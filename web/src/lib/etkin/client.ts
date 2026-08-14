/**
 * Etkin / Birikim Promosyon JSON API istemcisi.
 *
 * Kurallar:
 * - Scraper yok; sadece bu resmi endpoint.
 * - Anlık/sürekli "API Reader" yok — çağrılar sync job ile sınırlı.
 * - Resim hotlink yok — URL'ler sadece indirme için kullanılır.
 */

export type EtkinQueryTip =
  | "index"
  | "tum_kategoriler"
  | "tum_kategoriler_hiyerasi"
  | "tum_urunler"
  | "tum_urunler_varyant"
  | "tum_stok_fiyatlar"
  | "tum_stoklar_varyant"
  | "tekil_stok"
  | "tekil_fiyat"
  | "tekil_stok_fiyat"
  | "tekil_urun"
  | "tekil_kategori"
  | "array_urunler"
  | "array_kategoriler"
  | "array_kategori_urunler"
  | "array_varyant_kategori_urunler"
  | "array_stok_fiyatlar"
  | "array_index";

export type EtkinClientOptions = {
  apiUrl: string;
  hash: string;
  ebayiEposta: string;
  siteDomain: string;
  /** İstekler arası bekleme (rate limit / ban koruması) */
  requestGapMs?: number;
  onRequest?: () => void;
};

export class EtkinApiClient {
  private lastRequestAt = 0;
  private requestCount = 0;

  constructor(private readonly options: EtkinClientOptions) {}

  getRequestCount() {
    return this.requestCount;
  }

  async query<T = unknown>(
    tip: EtkinQueryTip,
    extra: Record<string, unknown> = {},
  ): Promise<T> {
    await this.throttle();

    const body = {
      ebayi_eposta: this.options.ebayiEposta,
      hash: this.options.hash,
      tip,
      ...extra,
    };

    const res = await fetch(this.options.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Dokümana göre User-Agent = site domain (www. olmadan)
        "User-Agent": this.options.siteDomain,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });

    this.requestCount += 1;
    this.options.onRequest?.();

    if (!res.ok) {
      throw new Error(`Etkin API HTTP ${res.status}: ${await res.text()}`);
    }

    return (await res.json()) as T;
  }

  private async throttle() {
    const gap = this.options.requestGapMs ?? 500;
    const now = Date.now();
    const wait = this.lastRequestAt + gap - now;
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    this.lastRequestAt = Date.now();
  }
}
