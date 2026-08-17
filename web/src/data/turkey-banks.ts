export type BankGroup = "kamu" | "ozel" | "katilim" | "diger";

export type TurkeyBank = {
  id: string;
  name: string;
  short: string;
  group: BankGroup;
};

export const BANK_GROUP_LABEL: Record<BankGroup, string> = {
  kamu: "Kamu bankaları",
  ozel: "Özel mevduat bankaları",
  katilim: "Katılım bankaları",
  diger: "Kalkınma ve yatırım bankaları",
};

export const BANK_GROUPS: BankGroup[] = ["kamu", "ozel", "katilim", "diger"];

/** BDDK’da yer alan mevduat, katılım, kalkınma ve yatırım bankaları. */
export const TURKEY_BANKS: TurkeyBank[] = [
  { id: "ziraat", name: "T.C. Ziraat Bankası A.Ş.", short: "Ziraat Bankası", group: "kamu" },
  { id: "halkbank", name: "Türkiye Halk Bankası A.Ş.", short: "Halkbank", group: "kamu" },
  { id: "vakifbank", name: "Türkiye Vakıflar Bankası T.A.O.", short: "VakıfBank", group: "kamu" },
  { id: "akbank", name: "Akbank T.A.Ş.", short: "Akbank", group: "ozel" },
  { id: "isbank", name: "Türkiye İş Bankası A.Ş.", short: "İş Bankası", group: "ozel" },
  { id: "yapikredi", name: "Yapı ve Kredi Bankası A.Ş.", short: "Yapı Kredi", group: "ozel" },
  { id: "garanti", name: "T. Garanti Bankası A.Ş.", short: "Garanti BBVA", group: "ozel" },
  { id: "qnb", name: "QNB Bank A.Ş.", short: "QNB", group: "ozel" },
  { id: "denizbank", name: "Denizbank A.Ş.", short: "DenizBank", group: "ozel" },
  { id: "teb", name: "Türk Ekonomi Bankası A.Ş.", short: "TEB", group: "ozel" },
  { id: "ing", name: "ING Bank A.Ş.", short: "ING", group: "ozel" },
  { id: "hsbc", name: "HSBC Bank A.Ş.", short: "HSBC", group: "ozel" },
  { id: "sekerbank", name: "Şekerbank T.A.Ş.", short: "Şekerbank", group: "ozel" },
  { id: "fibabanka", name: "Fibabanka A.Ş.", short: "Fibabanka", group: "ozel" },
  { id: "anadolubank", name: "Anadolubank A.Ş.", short: "Anadolubank", group: "ozel" },
  { id: "turkishbank", name: "Turkish Bank A.Ş.", short: "Turkish Bank", group: "ozel" },
  { id: "odeabank", name: "Odea Bank A.Ş.", short: "OdeaBank", group: "ozel" },
  { id: "alternatif", name: "Alternatifbank A.Ş.", short: "Alternatif Bank", group: "ozel" },
  { id: "burgan", name: "Burgan Bank A.Ş.", short: "Burgan Bank", group: "ozel" },
  { id: "icbc", name: "ICBC Turkey Bank A.Ş.", short: "ICBC Turkey", group: "ozel" },
  { id: "citibank", name: "Citibank A.Ş.", short: "Citibank", group: "ozel" },
  { id: "deutsche", name: "Deutsche Bank A.Ş.", short: "Deutsche Bank", group: "ozel" },
  { id: "arapturk", name: "Arap Türk Bankası A.Ş.", short: "Arap Türk Bankası", group: "ozel" },
  { id: "pasha", name: "Pasha Yatırım Bankası A.Ş.", short: "Pasha Bank", group: "ozel" },
  { id: "bankofchina", name: "Bank of China Turkey A.Ş.", short: "Bank of China", group: "ozel" },
  { id: "mufg", name: "MUFG Bank Turkey A.Ş.", short: "MUFG Bank", group: "ozel" },
  { id: "intesa", name: "Intesa Sanpaolo S.p.A.", short: "Intesa Sanpaolo", group: "ozel" },
  { id: "rabobank", name: "Rabobank A.Ş.", short: "Rabobank", group: "ozel" },
  { id: "jpmorgan", name: "JPMorgan Chase Bank N.A.", short: "J.P. Morgan", group: "ozel" },
  { id: "bny", name: "The Bank of New York Mellon", short: "BNY Mellon", group: "ozel" },
  { id: "socgen", name: "Société Générale (SA)", short: "Société Générale", group: "ozel" },
  { id: "scb", name: "Standard Chartered Bank", short: "Standard Chartered", group: "ozel" },
  { id: "habib", name: "Habib Bank Limited", short: "Habib Bank", group: "ozel" },
  { id: "mellat", name: "Bank Mellat", short: "Bank Mellat", group: "ozel" },
  { id: "ziraat-katilim", name: "Ziraat Katılım Bankası A.Ş.", short: "Ziraat Katılım", group: "katilim" },
  { id: "vakif-katilim", name: "Vakıf Katılım Bankası A.Ş.", short: "Vakıf Katılım", group: "katilim" },
  { id: "emlak-katilim", name: "Türkiye Emlak Katılım Bankası A.Ş.", short: "Emlak Katılım", group: "katilim" },
  { id: "kuveytturk", name: "Kuveyt Türk Katılım Bankası A.Ş.", short: "Kuveyt Türk", group: "katilim" },
  { id: "albaraka", name: "Albaraka Türk Katılım Bankası A.Ş.", short: "Albaraka Türk", group: "katilim" },
  { id: "turkiyefinans", name: "Türkiye Finans Katılım Bankası A.Ş.", short: "Türkiye Finans", group: "katilim" },
  { id: "hayat-finans", name: "Hayat Finans Katılım Bankası A.Ş.", short: "Hayat Finans", group: "katilim" },
  { id: "tskb", name: "Türkiye Sınai Kalkınma Bankası A.Ş.", short: "TSKB", group: "diger" },
  { id: "tkxb", name: "Türkiye Kalkınma ve Yatırım Bankası A.Ş.", short: "TKYB", group: "diger" },
  { id: "eximbank", name: "Türk Eximbank", short: "Eximbank", group: "diger" },
  { id: "iller", name: "İller Bankası A.Ş.", short: "İller Bankası", group: "diger" },
  { id: "takasbank", name: "İstanbul Takas ve Saklama Bankası A.Ş.", short: "Takasbank", group: "diger" },
  { id: "nurol", name: "Nurol Yatırım Bankası A.Ş.", short: "Nurolbank", group: "diger" },
  { id: "diler", name: "Diler Yatırım Bankası A.Ş.", short: "Dilerbank", group: "diger" },
  { id: "gsd", name: "GSD Yatırım Bankası A.Ş.", short: "GSD Bank", group: "diger" },
  { id: "destek", name: "Destek Yatırım Bankası A.Ş.", short: "Destekbank", group: "diger" },
  { id: "golden", name: "Golden Global Yatırım Bankası A.Ş.", short: "Golden Global", group: "diger" },
  { id: "bfb", name: "Birleşik Fon Bankası A.Ş.", short: "Birleşik Fon Bankası", group: "diger" },
];

export function getTurkeyBank(id: string | null | undefined) {
  if (!id) return null;
  return TURKEY_BANKS.find((bank) => bank.id === id) ?? null;
}

export function findTurkeyBankByName(name: string | null | undefined) {
  if (!name) return null;
  const needle = name.trim().toLocaleLowerCase("tr");
  return (
    TURKEY_BANKS.find(
      (bank) =>
        bank.id === needle ||
        bank.short.toLocaleLowerCase("tr") === needle ||
        bank.name.toLocaleLowerCase("tr") === needle,
    ) ?? null
  );
}

export const POPULAR_BANK_IDS = [
  "ziraat",
  "halkbank",
  "vakifbank",
  "akbank",
  "isbank",
  "yapikredi",
  "garanti",
  "qnb",
  "denizbank",
  "teb",
  "ing",
  "kuveytturk",
] as const;

export const BANK_BRAND: Record<string, { bg: string; fg: string }> = {
  ziraat: { bg: "#E30613", fg: "#ffffff" },
  halkbank: { bg: "#0057A0", fg: "#ffffff" },
  vakifbank: { bg: "#FDB913", fg: "#1a1a1a" },
  akbank: { bg: "#E10600", fg: "#ffffff" },
  isbank: { bg: "#003DA5", fg: "#ffffff" },
  yapikredi: { bg: "#0066B3", fg: "#ffffff" },
  garanti: { bg: "#009A44", fg: "#ffffff" },
  qnb: { bg: "#8A1538", fg: "#ffffff" },
  denizbank: { bg: "#EE7203", fg: "#ffffff" },
  teb: { bg: "#5B2C82", fg: "#ffffff" },
  ing: { bg: "#FF6200", fg: "#ffffff" },
  hsbc: { bg: "#DB0011", fg: "#ffffff" },
  sekerbank: { bg: "#00A651", fg: "#ffffff" },
  fibabanka: { bg: "#E31C23", fg: "#ffffff" },
  anadolubank: { bg: "#003366", fg: "#ffffff" },
  turkishbank: { bg: "#1B4F72", fg: "#ffffff" },
  odeabank: { bg: "#6F2C91", fg: "#ffffff" },
  alternatif: { bg: "#C8102E", fg: "#ffffff" },
  burgan: { bg: "#003DA5", fg: "#ffffff" },
  icbc: { bg: "#C8102E", fg: "#ffffff" },
  citibank: { bg: "#003B70", fg: "#ffffff" },
  deutsche: { bg: "#0018A8", fg: "#ffffff" },
  arapturk: { bg: "#007A3D", fg: "#ffffff" },
  pasha: { bg: "#1F4E79", fg: "#ffffff" },
  bankofchina: { bg: "#C8102E", fg: "#ffffff" },
  mufg: { bg: "#E60012", fg: "#ffffff" },
  intesa: { bg: "#003DA5", fg: "#ffffff" },
  rabobank: { bg: "#FF6200", fg: "#ffffff" },
  jpmorgan: { bg: "#0A2F5C", fg: "#ffffff" },
  bny: { bg: "#7A1F3D", fg: "#ffffff" },
  socgen: { bg: "#E2001A", fg: "#ffffff" },
  scb: { bg: "#0072AA", fg: "#ffffff" },
  habib: { bg: "#006747", fg: "#ffffff" },
  mellat: { bg: "#C8102E", fg: "#ffffff" },
  "ziraat-katilim": { bg: "#E30613", fg: "#ffffff" },
  "vakif-katilim": { bg: "#FDB913", fg: "#1a1a1a" },
  "emlak-katilim": { bg: "#1B4F72", fg: "#ffffff" },
  kuveytturk: { bg: "#003DA5", fg: "#ffffff" },
  albaraka: { bg: "#8B6914", fg: "#ffffff" },
  turkiyefinans: { bg: "#00A651", fg: "#ffffff" },
  "hayat-finans": { bg: "#0B6E4F", fg: "#ffffff" },
  tskb: { bg: "#003DA5", fg: "#ffffff" },
  tkxb: { bg: "#1B4F72", fg: "#ffffff" },
  eximbank: { bg: "#E30613", fg: "#ffffff" },
  iller: { bg: "#0B6E4F", fg: "#ffffff" },
  takasbank: { bg: "#003DA5", fg: "#ffffff" },
  nurol: { bg: "#1A365D", fg: "#ffffff" },
  diler: { bg: "#2C5282", fg: "#ffffff" },
  gsd: { bg: "#2B6CB0", fg: "#ffffff" },
  destek: { bg: "#C53030", fg: "#ffffff" },
  golden: { bg: "#B7791F", fg: "#ffffff" },
  bfb: { bg: "#2D3748", fg: "#ffffff" },
};

export function getBankBrand(id: string) {
  return BANK_BRAND[id] ?? { bg: "#0B2A4A", fg: "#ffffff" };
}

export const BANK_LOGO_SRC: Record<string, string> = {
  ziraat: "/banks/ziraat.png",
  halkbank: "/banks/halkbank.png",
  vakifbank: "/banks/vakifbank.png",
  akbank: "/banks/akbank.jpg",
  isbank: "/banks/isbank.jpg",
  yapikredi: "/banks/yapikredi.png",
  garanti: "/banks/garanti.png",
  qnb: "/banks/qnb.png",
  denizbank: "/banks/denizbank.png",
  teb: "/banks/teb.png",
  ing: "/banks/ing.png",
  hsbc: "/banks/hsbc.png",
  sekerbank: "/banks/sekerbank.png",
  fibabanka: "/banks/fibabanka.png",
  anadolubank: "/banks/anadolubank.png",
  turkishbank: "/banks/turkishbank.png",
  odeabank: "/banks/odeabank.png",
  alternatif: "/banks/alternatif.png",
  burgan: "/banks/burgan.png",
  icbc: "/banks/icbc.png",
  citibank: "/banks/citibank.png",
  deutsche: "/banks/deutsche.png",
  arapturk: "/banks/arapturk.jpeg",
  bankofchina: "/banks/bankofchina.jpg",
  mufg: "/banks/mufg.png",
  intesa: "/banks/intesa.png",
  rabobank: "/banks/rabobank.png",
  habib: "/banks/habib.jpg",
  mellat: "/banks/mellat.png",
  socgen: "/banks/socgen.png",
  "ziraat-katilim": "/banks/ziraat-katilim.png",
  "vakif-katilim": "/banks/vakif-katilim.png",
  "emlak-katilim": "/banks/emlak-katilim.png",
  kuveytturk: "/banks/kuveytturk.png",
  albaraka: "/banks/albaraka.png",
  turkiyefinans: "/banks/turkiyefinans.png",
};

export function bankLogoSrc(id: string) {
  return BANK_LOGO_SRC[id] ?? null;
}

export function bankInitials(short: string) {
  const parts = short.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toLocaleUpperCase("tr");
  }
  return short.replace(/\s+/g, "").slice(0, 2).toLocaleUpperCase("tr") || "B";
}

export function formatIban(iban: string) {
  const clean = iban.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

export const IBAN_MASK = formatIban(`TR${"0".repeat(24)}`);

export function sanitizeIbanInput(value: string) {
  return formatIban(value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 26));
}

export function sanitizeTrIbanInput(value: string) {
  const raw = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const rest = (raw.startsWith("TR") ? raw.slice(2) : raw).replace(/\D/g, "").slice(0, 24);
  return formatIban(`TR${rest}`);
}

export function searchTurkeyBanks(query: string, limit = 8) {
  const q = query.trim().toLocaleLowerCase("tr");
  if (!q) {
    return POPULAR_BANK_IDS.map((id) => getTurkeyBank(id)).filter((bank): bank is TurkeyBank => Boolean(bank));
  }

  const scored = TURKEY_BANKS.map((bank) => {
    const fields = [bank.short, bank.name, bank.id].map((value) => value.toLocaleLowerCase("tr"));
    let score = 0;
    if (fields.some((field) => field.startsWith(q))) score = 3;
    else if (fields.some((field) => field.split(/[\s./-]+/).some((word) => word.startsWith(q)))) score = 2;
    else if (fields.some((field) => field.includes(q))) score = 1;
    return { bank, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.bank.short.localeCompare(b.bank.short, "tr"));

  return scored.slice(0, limit).map((row) => row.bank);
}
