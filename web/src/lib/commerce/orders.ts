import { prisma } from "../db";
import { randomToken } from "../security/crypto";
import type { AuthUser } from "../auth/session";
import { iyzicoIsReady, isPaymentMethodActive } from "./payments";
import { saveUserAddress } from "./addresses";
import { findTransferAccount, formatIban, getEnabledTransferBanks } from "./transfer-banks";
import { validateCouponForCart, cartLinesForCoupon } from "./coupons";
import { notifyOrderPlaced } from "./email-templates";
import { getSiteSettings, shippingCharge, stockAllowsSale } from "@/lib/site-settings";

export {
  CARGO_STATUS_OPTIONS,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  customerShippingCopy,
  isOfficePickup,
  shippingSteps,
} from "./orders-copy";
export type { ShippingStep } from "./orders-copy";

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
  orderNote?: string;
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

function istanbulYearShort(now = new Date()) {
  const year = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).format(now);
  return year.slice(-2);
}

function isPublicNumberConflict(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  if ((error as { code?: string }).code !== "P2002") return false;
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  return Array.isArray(target) && target.includes("publicNumber");
}

async function nextPublicOrderNumber(
  db: { order: { findMany: typeof prisma.order.findMany } },
  prefix: string,
) {
  const head = `${prefix}-${istanbulYearShort()}-`;
  const rows = await db.order.findMany({
    where: { publicNumber: { startsWith: head } },
    select: { publicNumber: true },
  });
  let max = 0;
  for (const row of rows) {
    const rest = row.publicNumber.slice(head.length);
    if (!/^\d+$/.test(rest)) continue;
    const n = Number(rest);
    if (n > max) max = n;
  }
  return `${head}${max + 1}`;
}

export async function createOrderFromCart(user: AuthUser, address: CheckoutAddress) {
  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: { items: { include: { product: true } }, coupon: true },
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
  if (!(await isPaymentMethodActive(address.paymentMethod ?? "transfer"))) {
    throw new Error("Bu ödeme yöntemi kapalı");
  }
  if (address.paymentMethod === "card" && !(await iyzicoIsReady())) {
    throw new Error("Kart ödemesi şu an kullanılamıyor");
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

  const settings = await getSiteSettings();

  for (const item of cart.items) {
    const p = item.product;
    if (!p.isActive || p.removed) throw new Error(`${p.name} satışta değil`);
    if (!stockAllowsSale(p.stockTotal, settings) || (settings.stock.stockTrackingEnabled && p.stockTotal < item.quantity && !settings.order.allowOutOfStockOrder && settings.stock.outOfStockBehavior !== "CONTINUE_SALE")) {
      throw new Error(`${p.name} için yetersiz stok`);
    }
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

  const goodsTotal = money(subtotal + vatTotal);
  let discountTotal = 0;
  let couponId: string | null = null;
  let couponCode: string | null = null;
  if (cart.coupon) {
    const check = await validateCouponForCart(cart.coupon, cartLinesForCoupon(cart.items), {
      userId: user.id,
    });
    if (check.error) throw new Error(check.error);
    discountTotal = check.amount;
    couponId = cart.coupon.id;
    couponCode = cart.coupon.code;
  }
  const discountedGoodsTotal = money(Math.max(0, goodsTotal - discountTotal));
  const shippingTotal = money(shippingCharge(discountedGoodsTotal, settings));
  const grandTotal = money(discountedGoodsTotal + shippingTotal);
  if (settings.order.minimumOrderAmount > 0 && grandTotal < settings.order.minimumOrderAmount) {
    throw new Error(`Minimum sipariş tutarı ${settings.order.minimumOrderAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL`);
  }

  const prefix = (settings.order.orderNumberPrefix || "ESER").replace(/-+$/g, "") || "ESER";

  const order = await (async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        return await prisma.$transaction(async (tx) => {
          const publicNumber = await nextPublicOrderNumber(tx, prefix);
          if (couponId) {
      const locked = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!locked) throw new Error("Kupon bulunamadı");
      if (locked.usageLimit != null && locked.usedCount >= locked.usageLimit) {
        throw new Error("Bu kuponun kullanım limiti doldu");
      }
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    const created = await tx.order.create({
      data: {
        publicNumber,
        userId: user.id,
        status: "pending_payment",
        subtotal,
        vatTotal,
        shippingTotal,
        discountTotal,
        couponId,
        couponCode,
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
                `Ödeme: Havale / EFT`,
                `Banka adı: ${transferAccount.name}`,
                transferAccount.holder ? `Alıcı: ${transferAccount.holder}` : "",
                `IBAN: ${formatIban(transferAccount.iban)}`,
                `Hesap türü: ${transferAccount.accountType}`,
              ]
                .filter(Boolean)
                .join("\n")
            : "Ödeme: Kredi kartı",
          couponCode && discountTotal > 0
            ? `Kupon: ${couponCode} (−₺${discountTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })})`
            : "",
          settings.order.orderNoteEnabled && address.orderNote?.trim()
            ? `Sipariş notu: ${address.orderNote.trim()}`
            : "",
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

    if (couponId && discountTotal > 0) {
      await tx.couponRedemption.create({
        data: {
          couponId,
          orderId: created.id,
          userId: user.id,
          amount: discountTotal,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    return created;
        });
      } catch (error) {
        if (!isPublicNumberConflict(error) || attempt === 7) throw error;
      }
    }
    throw new Error("Sipariş numarası üretilemedi");
  })();

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

  try {
    await notifyOrderPlaced(order.id);
  } catch (error) {
    console.error("order email", error);
  }

  return { order, iyzicoReady: await iyzicoIsReady(), paymentMethod: address.paymentMethod ?? "transfer" };
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
