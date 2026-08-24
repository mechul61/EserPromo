import { prisma } from "../db";

export const PAYMENT_KIND_LABEL = {
  card: "Kredi Kartı",
  transfer: "Banka Transferi",
  wallet: "Dijital Cüzdan",
  cod: "Kapıda Ödeme",
} as const;

export const PAYMENT_PROVIDER_LABEL: Record<string, string> = {
  iyzico: "iyzico",
  store: "Mağaza Tanımlı",
  paypal: "PayPal",
};

export type PaymentMethodKey = "card" | "transfer";
export type PaymentMethodKindId = keyof typeof PAYMENT_KIND_LABEL;
export const CHECKOUT_METHOD_KEYS: PaymentMethodKey[] = ["card", "transfer"];

export function isCheckoutMethodKey(key: string): key is PaymentMethodKey {
  return key === "card" || key === "transfer";
}

export type CheckoutPaymentMethod = {
  key: PaymentMethodKey;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

const DEFAULTS: Array<{
  key: string;
  name: string;
  description: string;
  kind: PaymentMethodKindId;
  provider: string;
  isActive: boolean;
  sortOrder: number;
}> = [
  {
    key: "card",
    name: "Kredi Kartı",
    description: "Visa, Mastercard, Troy ile ödeme",
    kind: "card",
    provider: "iyzico",
    isActive: true,
    sortOrder: 1,
  },
  {
    key: "transfer",
    name: "EFT / Havale",
    description: "Banka hesabına EFT veya havale",
    kind: "transfer",
    provider: "store",
    isActive: true,
    sortOrder: 2,
  },
  {
    key: "cod",
    name: "Kapıda Ödeme",
    description: "Teslimat sırasında nakit ödeme",
    kind: "cod",
    provider: "store",
    isActive: false,
    sortOrder: 3,
  },
  {
    key: "transfer_extra",
    name: "Havale ile Ödeme",
    description: "Banka havalesi ile ödeme",
    kind: "transfer",
    provider: "store",
    isActive: false,
    sortOrder: 4,
  },
  {
    key: "paypal",
    name: "PayPal",
    description: "PayPal hesabı ile ödeme",
    kind: "wallet",
    provider: "paypal",
    isActive: false,
    sortOrder: 5,
  },
  {
    key: "iyzico_transfer",
    name: "Iyzico Havale",
    description: "iyzico ile banka transferi",
    kind: "transfer",
    provider: "iyzico",
    isActive: false,
    sortOrder: 6,
  },
];

export async function ensurePaymentMethods() {
  await Promise.all(
    DEFAULTS.map((item) =>
      prisma.paymentMethod.upsert({
        where: { key: item.key },
        create: item,
        update: {},
      }),
    ),
  );
}

export async function getCheckoutPaymentMethods(): Promise<CheckoutPaymentMethod[]> {
  await ensurePaymentMethods();
  const rows = await prisma.paymentMethod.findMany({
    where: { key: { in: CHECKOUT_METHOD_KEYS } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows
    .filter((row) => row.isActive)
    .map((row) => ({
      key: row.key as PaymentMethodKey,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    }));
}

export async function isPaymentMethodActive(key: PaymentMethodKey) {
  if (!isCheckoutMethodKey(key)) return false;
  const row = await prisma.paymentMethod.findUnique({ where: { key }, select: { isActive: true } });
  if (!row) return true;
  return row.isActive;
}

const IYZICO_KEYS = ["iyzicoUri", "iyzicoApiKey", "iyzicoSecretKey"] as const;

export type IyzicoConfig = {
  uri: string;
  apiKey: string;
  secretKey: string;
};

export async function getIyzicoConfig(): Promise<IyzicoConfig> {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: [...IYZICO_KEYS] } } });
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    uri: (map.iyzicoUri || process.env.IYZICO_URI || "").trim(),
    apiKey: (map.iyzicoApiKey || process.env.IYZICO_API_KEY || "").trim(),
    secretKey: (map.iyzicoSecretKey || process.env.IYZICO_SECRET_KEY || "").trim(),
  };
}

export function iyzicoConfigReady(config: IyzicoConfig) {
  return Boolean(config.uri && config.apiKey && config.secretKey);
}

export async function iyzicoIsReady() {
  return iyzicoConfigReady(await getIyzicoConfig());
}

export function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "•".repeat(value.length);
  return `${value.slice(0, 4)}${"•".repeat(Math.min(12, value.length - 4))}`;
}

export async function setIyzicoConfig(input: { uri?: string; apiKey?: string; secretKey?: string }) {
  const current = await getIyzicoConfig();
  const next = {
    iyzicoUri: (input.uri ?? current.uri).trim(),
    iyzicoApiKey:
      input.apiKey !== undefined
        ? (input.apiKey.includes("•") ? current.apiKey : input.apiKey.trim())
        : current.apiKey,
    iyzicoSecretKey:
      input.secretKey !== undefined
        ? (input.secretKey.includes("•") ? current.secretKey : input.secretKey.trim())
        : current.secretKey,
  };
  await Promise.all(
    Object.entries(next).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
  return next;
}
