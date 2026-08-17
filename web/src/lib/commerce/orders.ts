import { prisma } from "../db";
import { randomToken } from "../security/crypto";
import type { AuthUser } from "../auth/session";
import { iyzicoReady } from "../env";
import { saveUserAddress } from "./addresses";
import { findTransferAccount, formatIban, getEnabledTransferBanks } from "./transfer-banks";

export const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: "Taslak",
  pending_payment: "Ödeme bekleniyor",
  paid: "Ödendi",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  completed: "Tamamlandı",
  cancelled: "İptal",
  failed: "Başarısız",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Ödeme bekleniyor",
  success: "Ödeme alındı",
  failure: "Ödeme başarısız",
  refunded: "İade edildi",
};

export type CheckoutAddress = {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
  email?: string;
  postalCode?: string;
  deliveryMethod?: "address" | "office";
  invoiceType?: "individual" | "corporate";
  paymentMethod?: "card" | "transfer";
  transferBank?: string;
  transferKind?: "havale" | "eft";
  billingDifferent?: boolean;
  billingFullName?: string;
  billingPhone?: string;
  billingCity?: string;
  billingDistrict?: string;
  billingLine?: string;
  billingPostalCode?: string;
  tcKimlik?: string;
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
};

function money(n: number) {
  return Math.round(n * 100) / 100;
}

export function lineTotals(unitPrice: number, vatRate: number, qty: number) {
  const exVat = unitPrice * qty;
  const vat = exVat * (vatRate / 100);
  return {
    subtotal: money(exVat),
    vatTotal: money(vat),
    grand: money(exVat + vat),
  };
}

function publicOrderNumber() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `EP-${y}${m}${day}-${randomToken(3).slice(0, 6).toUpperCase()}`;
}

export async function createOrderFromCart(user: AuthUser, address: CheckoutAddress) {
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } } },
  });
  if (!cart || cart.items.length === 0) {
    throw new Error("Sepet boş");
  }

  const transferAccount =
    address.paymentMethod === "transfer"
      ? findTransferAccount(await getEnabledTransferBanks(), address.transferBank ?? "")
      : null;
  if (address.paymentMethod === "transfer" && !transferAccount) {
    throw new Error("Listeden banka seçin");
  }

  let subtotal = 0;
  let vatTotal = 0;
  const itemData: Array<{
    productId: number;
    sku: string;
    name: string;
    color: string | null;
    quantity: number;
    unitPrice: typeof cart.items[number]["product"]["price"];
    vatRate: typeof cart.items[number]["product"]["vatRate"];
    lineTotal: number;
  }> = [];

  for (const item of cart.items) {
    const p = item.product;
    if (!p.isActive) throw new Error(`${p.name} satışta değil`);
    if (p.stockTotal < item.quantity) throw new Error(`${p.name} için yetersiz stok`);
    const t = lineTotals(Number(p.price), Number(p.vatRate), item.quantity);
    subtotal += t.subtotal;
    vatTotal += t.vatTotal;
    itemData.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      color: p.color,
      quantity: item.quantity,
      unitPrice: p.price,
      vatRate: p.vatRate,
      lineTotal: t.grand,
    });
  }

  const grandTotal = money(subtotal + vatTotal);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        publicNumber: publicOrderNumber(),
        userId: user.id,
        status: "pending_payment",
        subtotal,
        vatTotal,
        shippingTotal: 0,
        grandTotal,
        shipFullName: address.fullName.trim(),
        shipPhone: address.phone.trim(),
        shipCity: address.city.trim(),
        shipDistrict: address.district.trim(),
        shipLine: address.line.trim(),
        customerNote: [
          address.deliveryMethod === "office" ? "Teslimat: Ofisten teslim al" : "Teslimat: Adrese gönderim",
          address.email ? `E-posta: ${address.email.trim()}` : "",
          address.postalCode ? `Posta kodu: ${address.postalCode.trim()}` : "",
          address.billingDifferent
            ? address.invoiceType === "corporate"
              ? "Fatura: Kurumsal"
              : "Fatura: Bireysel"
            : "Fatura: Teslimat adresi ile aynı",
          address.billingDifferent && address.invoiceType === "individual" && address.tcKimlik
            ? `TCKN: ${address.tcKimlik.trim()}`
            : "",
          address.billingDifferent && address.invoiceType === "corporate" && address.companyName
            ? `Şirket: ${address.companyName.trim()}`
            : "",
          address.billingDifferent && address.invoiceType === "corporate" && address.taxOffice
            ? `Vergi dairesi: ${address.taxOffice.trim()}`
            : "",
          address.billingDifferent && address.invoiceType === "corporate" && address.taxNumber
            ? `Vergi no: ${address.taxNumber.trim()}`
            : "",
          address.billingDifferent
            ? [
                "Fatura adresi farklı:",
                address.billingFullName?.trim(),
                address.billingPhone?.trim(),
                [address.billingLine?.trim(), address.billingDistrict?.trim(), address.billingCity?.trim()]
                  .filter(Boolean)
                  .join(", "),
                address.billingPostalCode ? `PK: ${address.billingPostalCode.trim()}` : "",
              ]
                .filter(Boolean)
                .join(" ")
            : "",
          address.paymentMethod === "transfer" && transferAccount
            ? [
                `Ödeme: ${address.transferKind === "havale" ? "Havale" : "EFT"}`,
                `Banka adı: ${transferAccount.name}`,
                transferAccount.holder ? `Alıcı: ${transferAccount.holder}` : "",
                `IBAN: ${formatIban(transferAccount.iban)}`,
                `Hesap türü: ${transferAccount.accountType}`,
              ]
                .filter(Boolean)
                .join("\n")
            : "Ödeme: Kredi kartı",
        ]
          .filter(Boolean)
          .join("\n"),
        items: { create: itemData },
        payments: {
          create: {
            amount: grandTotal,
            status: "pending",
            provider: address.paymentMethod === "transfer" ? "transfer" : "iyzico",
            conversationId: randomToken(16),
          },
        },
      },
      include: { items: true, payments: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  if (address.deliveryMethod !== "office") {
    await saveUserAddress(user.id, {
      title: "Teslimat",
      fullName: address.fullName,
      email: address.email,
      phone: address.phone,
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
      line: address.line,
      isDefault: true,
    });
  }

  if (address.billingDifferent && address.billingLine && address.billingCity && address.billingDistrict) {
    await saveUserAddress(user.id, {
      title: "Fatura",
      fullName: address.billingFullName || address.fullName,
      email: address.email,
      phone: address.billingPhone || address.phone,
      city: address.billingCity,
      district: address.billingDistrict,
      postalCode: address.billingPostalCode,
      line: address.billingLine,
      isDefault: false,
    });
  }

  return { order, iyzicoReady: iyzicoReady() };
}

export async function getUserOrder(userId: string, publicNumber: string) {
  return prisma.order.findFirst({
    where: { userId, publicNumber },
    include: {
      items: {
        include: {
          product: {
            select: {
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { localPath: true } },
            },
          },
        },
      },
      payments: { select: { status: true, provider: true, amount: true, createdAt: true } },
    },
  });
}
