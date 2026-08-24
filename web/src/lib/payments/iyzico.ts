/**
 * Iyzico Checkout Form — kart verisi bu sunucuya gelmez.
 */

import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { phoneDigits } from "@/lib/phone";
import { getIyzicoConfig, iyzicoIsReady } from "@/lib/commerce/payments";
import {
  createIyzipayClient,
  iyzicoCheckoutInitialize,
  iyzicoCheckoutRetrieve,
  type IyzicoApiResult,
} from "./iyzico-client";

export { assertIyzicoConfigured } from "./iyzico-guard";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { name: "Müşteri", surname: "Müşteri" };
  if (parts.length === 1) return { name: parts[0], surname: parts[0] };
  return { name: parts.slice(0, -1).join(" "), surname: parts.at(-1)! };
}

function iyzicoGsm(phone: string) {
  const digits = phoneDigits(phone);
  if (!digits) return "+905555555555";
  if (digits.startsWith("0")) return `+9${digits}`;
  return `+90${digits}`;
}

function moneyString(value: number) {
  return value.toFixed(2);
}

function mapPaymentStatus(result: IyzicoApiResult) {
  if (result.paymentStatus === "SUCCESS") return "success" as const;
  if (result.paymentStatus === "FAILURE") return "failure" as const;
  return "pending" as const;
}

export async function markIyzicoPaymentSuccess(paymentId: string, providerPaymentId: string) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "success",
        providerPaymentId,
        errorMessage: null,
      },
      include: { order: true },
    });
    if (payment.order.status === "pending_payment") {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "paid", paidAt: new Date() },
      });
    }
  });
}

export async function markIyzicoPaymentFailure(paymentId: string, message: string) {
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "failure",
      errorMessage: message.slice(0, 500),
    },
  });
}

type OrderForIyzico = NonNullable<Awaited<ReturnType<typeof loadPayableOrder>>>;

async function loadPayableOrder(orderPublicNumber: string, userId: string) {
  return prisma.order.findFirst({
    where: { publicNumber: orderPublicNumber, userId },
    include: {
      items: true,
      user: { select: { email: true, name: true } },
      payments: {
        where: { provider: "iyzico" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

function distributeOrderTotal(items: Array<{ lineTotal: unknown }>, target: number) {
  const raw = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
  if (raw <= 0) return items.map(() => "0.00");
  const prices = items.map((item) => Number(((Number(item.lineTotal) * target) / raw).toFixed(2)));
  const sum = prices.reduce((acc, value) => acc + value, 0);
  const diff = Math.round((target - sum) * 100) / 100;
  prices[prices.length - 1] = Math.max(0, Math.round((prices[prices.length - 1] + diff) * 100) / 100);
  return prices.map((value) => value.toFixed(2));
}

function buildCheckoutRequest(order: OrderForIyzico, payment: OrderForIyzico["payments"][number], clientIp: string) {
  const buyerName = splitName(order.shipFullName);
  const grandTotal = Number(order.grandTotal);
  const linePrices = distributeOrderTotal(order.items, grandTotal);
  const callbackUrl = `${siteUrl()}/api/payments/iyzico/callback/`;

  return {
    locale: "tr",
    conversationId: payment.conversationId!,
    price: moneyString(grandTotal),
    paidPrice: moneyString(grandTotal),
    currency: "TRY",
    basketId: order.publicNumber,
    paymentGroup: "PRODUCT",
    callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9, 12],
    buyer: {
      id: order.userId,
      name: buyerName.name,
      surname: buyerName.surname,
      gsmNumber: iyzicoGsm(order.shipPhone),
      email: order.user.email,
      identityNumber: "11111111111",
      lastLoginDate: new Date().toISOString().slice(0, 19).replace("T", " "),
      registrationDate: order.createdAt.toISOString().slice(0, 19).replace("T", " "),
      registrationAddress: order.shipLine,
      ip: clientIp || "127.0.0.1",
      city: order.shipCity,
      country: "Turkey",
      zipCode: "34000",
    },
    shippingAddress: {
      contactName: order.shipFullName,
      city: order.shipCity,
      country: "Turkey",
      address: order.shipLine,
      zipCode: "34000",
    },
    billingAddress: {
      contactName: order.shipFullName,
      city: order.shipCity,
      country: "Turkey",
      address: order.shipLine,
      zipCode: "34000",
    },
    basketItems: order.items.map((item, index) => ({
      id: String(item.productId),
      name: item.name.slice(0, 100),
      category1: "Promosyon",
      itemType: "PHYSICAL",
      price: linePrices[index] ?? moneyString(Number(item.lineTotal)),
    })),
  };
}

export async function initializeIyzicoCheckout(input: {
  orderPublicNumber: string;
  userId: string;
  clientIp: string;
}) {
  if (!(await iyzicoIsReady())) {
    throw new Error("Iyzico henüz yapılandırılmadı");
  }

  const order = await loadPayableOrder(input.orderPublicNumber, input.userId);
  if (!order) throw new Error("Sipariş bulunamadı");
  if (order.status !== "pending_payment") throw new Error("Bu sipariş için ödeme alınamaz");

  const payment = order.payments[0];
  if (!payment) throw new Error("Ödeme kaydı bulunamadı");
  if (payment.status === "success") throw new Error("Bu sipariş zaten ödendi");
  if (!payment.conversationId) throw new Error("Ödeme oturumu geçersiz");

  const config = await getIyzicoConfig();
  const client = createIyzipayClient(config);
  const request = buildCheckoutRequest(order, payment, input.clientIp);
  const result = await iyzicoCheckoutInitialize(client, request);

  if (result.status !== "success") {
    throw new Error(result.errorMessage || "Iyzico ödeme formu başlatılamadı");
  }

  return {
    token: result.token ?? "",
    checkoutFormContent: result.checkoutFormContent ?? "",
    paymentPageUrl: result.paymentPageUrl ?? "",
  };
}

export async function finalizeIyzicoCheckout(token: string) {
  if (!(await iyzicoIsReady())) {
    throw new Error("Iyzico henüz yapılandırılmadı");
  }
  if (!token.trim()) throw new Error("Geçersiz ödeme oturumu");

  const config = await getIyzicoConfig();
  const client = createIyzipayClient(config);
  const result = await iyzicoCheckoutRetrieve(client, {
    locale: "tr",
    token: token.trim(),
  });

  if (result.status !== "success") {
    throw new Error(result.errorMessage || "Ödeme sonucu alınamadı");
  }

  const payment = await prisma.payment.findFirst({
    where: { conversationId: result.conversationId ?? undefined, provider: "iyzico" },
    include: { order: true },
  });
  if (!payment) throw new Error("Ödeme kaydı eşleşmedi");

  const mapped = mapPaymentStatus(result);
  if (mapped === "success") {
    await markIyzicoPaymentSuccess(payment.id, result.paymentId || payment.providerPaymentId || payment.id);
    return { ok: true as const, orderNumber: payment.order.publicNumber, paymentStatus: "success" as const };
  }

  const message = result.errorMessage || "Ödeme tamamlanamadı";
  await markIyzicoPaymentFailure(payment.id, message);
  return {
    ok: false as const,
    orderNumber: payment.order.publicNumber,
    paymentStatus: "failure" as const,
    message,
  };
}
