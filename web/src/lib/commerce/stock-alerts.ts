import { prisma } from "../db";
import { productPath } from "../seo/urls";
import { siteUrl } from "../env";
import { notifyStockBackInMail, safeNotify } from "./email-templates";

export function isRestock(oldStock: number, newStock: number) {
  return oldStock <= 0 && newStock > 0;
}

export async function subscribeStockNotify(input: {
  productId: number;
  email: string;
  userId?: string | null;
}) {
  const email = input.email.trim().toLowerCase();
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, stockTotal: true, isActive: true, removed: true },
  });
  if (!product || product.removed || !product.isActive) {
    return { ok: false as const, error: "Ürün bulunamadı" };
  }
  if (product.stockTotal > 0) {
    return { ok: false as const, error: "Ürün şu an stokta; sepete ekleyebilirsiniz" };
  }

  await prisma.stockNotifyRequest.upsert({
    where: {
      productId_email: { productId: input.productId, email },
    },
    create: {
      productId: input.productId,
      email,
      userId: input.userId ?? null,
      notifiedAt: null,
    },
    update: {
      userId: input.userId ?? undefined,
      notifiedAt: null,
    },
  });

  return { ok: true as const };
}

export async function notifyStockBackIn(input: {
  productId: number;
  name: string;
  slug: string;
}) {
  const pending = await prisma.stockNotifyRequest.findMany({
    where: { productId: input.productId, notifiedAt: null },
    select: { id: true, email: true, userId: true },
    take: 500,
  });
  if (pending.length === 0) return { sent: 0 };

  const href = productPath(input.slug);
  const productUrl = `${siteUrl()}${href.endsWith("/") ? href : `${href}/`}`;
  const title = "Ürün stoka girdi";
  const body = `${input.name} stoka girdi. Hemen inceleyebilirsiniz.`;
  let sent = 0;

  for (const row of pending) {
    await prisma.stockNotifyRequest.update({
      where: { id: row.id },
      data: { notifiedAt: new Date() },
    });

    if (row.userId) {
      await prisma.userNotification.create({
        data: {
          userId: row.userId,
          type: "stock_back_in",
          title,
          body,
          href,
          productId: input.productId,
        },
      });
    }

    await safeNotify(
      notifyStockBackInMail({
        to: row.email,
        productName: input.name,
        productUrl,
      }),
    );
    sent += 1;
  }

  return { sent };
}
