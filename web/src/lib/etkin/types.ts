/**
 * Etkin / Birikim Promosyon API yanıt tipleri (kullandığımız alanlar).
 */

export type EtkinIndex = {
  sezonbilgiler?: {
    sezonyili?: string;
    katalog_url?: string;
    fiyatlistesi_url?: string;
    baskifiyatlistesi_url?: string;
    toplam_kategori?: number;
    toplam_urun?: number;
  };
  kategoriler?: Array<{ kategori_id: number; md5: string }>;
  urunler?: Array<{ urun_id: number; md5: string }>;
  Hata?: string;
};

export type EtkinCategory = {
  kategori_id: number;
  ustkategori_id?: number | string | null;
  anasayfa_gosterim?: number | string;
  anasayfa_sira?: number | string;
  isim: string;
  sira?: number | string;
  aciklama?: string;
  resim?: string;
  kat_icon?: string;
  md5?: string;
  Hata?: string;
};

export type EtkinProduct = {
  urun_id: number;
  kategori_id: number;
  kategori_adi?: string;
  urun_kodu: string;
  urun_kodgrup?: string;
  urun_isim: string;
  urun_baslik?: string;
  urun_aciklama?: string;
  urun_renk?: string;
  urun_ebat?: string;
  sira?: number | string;
  ozellik?: string;
  imalat?: number | string;
  toplam_stok?: number | string;
  mstok?: number | string;
  istok?: number | string;
  tstok?: number | string;
  urun_fiyat?: string | number;
  urun_fiyat_virgul?: string;
  fiyat_kdv?: number | string;
  kirmiziurun?: number | string;
  urun_trase?: string;
  urun_trase_dosya_isim?: string;
  urun_trase_dosya_boyut?: number | string;
  katalog_sayfa_no?: number | string;
  resim1?: string;
  resim2?: string;
  resim3?: string;
  resim4?: string;
  resim5?: string;
  resim6?: string;
  resim7?: string;
  resim8?: string;
  resim9?: string;
  md5?: string;
  /** tum_urunler_varyant / array_varyant_* */
  varyantlar?: EtkinProduct[];
  Hata?: string;
};

export function etkinImageUrls(product: EtkinProduct): Array<{ sortOrder: number; url: string }> {
  const out: Array<{ sortOrder: number; url: string }> = [];
  for (let i = 1; i <= 9; i++) {
    const url = product[`resim${i}` as keyof EtkinProduct];
    if (typeof url === "string" && url.trim()) {
      out.push({ sortOrder: i, url: url.trim() });
    }
  }
  return out;
}

/** "9.200" / "9,200" → Decimal uyumlu number */
export function parseEtkinPrice(value: string | number | undefined | null): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  const raw = value.trim();
  if (raw.includes(",") && raw.includes(".")) {
    // 1.234,56
    return Number(raw.replace(/\./g, "").replace(",", "."));
  }
  if (raw.includes(",")) {
    return Number(raw.replace(",", "."));
  }
  return Number(raw);
}

export function toInt(value: unknown, fallback = 0): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
