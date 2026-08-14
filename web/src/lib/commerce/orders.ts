import { prisma } from "../db";
import { randomToken } from "../security/crypto";
import type { AuthUser } from "../auth/session";
import { iyzicoReady } from "../env";

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
          address.invoiceType === "corporate" ? "Fatura: Kurumsal" : "Fatura: Bireysel",
          address.paymentMethod === "transfer" ? "Ödeme: Havale / EFT" : "Ödeme: Kredi kartı",
        ]
          .filter(Boolean)
          .join("\n"),
        items: { create: itemData },
        payments: {
          create: {
            amount: grandTotal,
            status: "pending",
            conversationId: randomToken(16),
          },
        },
      },
      include: { items: true, payments: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return created;
  });

  return { order, iyzicoReady: iyzicoReady() };
}

export async function getUserOrder(userId: string, publicNumber: string) {
  return prisma.order.findFirst({
    where: { userId, publicNumber },
    include: { items: true, payments: { select: { status: true, provider: true, amount: true, createdAt: true } } },
  });
}
