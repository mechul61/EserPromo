import { prisma } from "../db";
import { formatPriceTry } from "../media";
import { notifyFavoriteDiscountMail, safeNotify } from "./email-templates";
import { productPath } from "../seo/urls";
import { siteUrl } from "../env";

const PRICE_DROP_MIN = 0.01;
const DEDUPE_MS = 7 * 24 * 60 * 60 * 1000;

export function isFavoriteDiscount({
  oldPrice,
  newPrice,
  wasDiscounted,
  isDiscounted,
}: {
  oldPrice: number;
  newPrice: number;
  wasDiscounted: boolean;
  isDiscounted: boolean;
}) {
  const priceDropped = Number.isFinite(oldPrice) && Number.isFinite(newPrice) && newPrice + PRICE_DROP_MIN < oldPrice;
  const wentOnSale = !wasDiscounted && isDiscounted;
  return priceDropped || wentOnSale;
}

export async function notifyFavoriteDiscount(input: {
  productId: number;
  name: string;
  slug: string;
  oldPrice: number;
  newPrice: number;
  wentOnSale: boolean;
}) {
  const favorites = await prisma.favorite.findMany({
    where: { productId: input.productId, user: { isActive: true } },
    select: {
      userId: true,
      user: {
        select: {
          email: true,
          name: true,
          phone: true,
          profile: {
            select: {
              notifyEmail: true,
              notifySms: true,
              notifyWhatsapp: true,
            },
          },
        },
      },
    },
  });
  if (favorites.length === 0) return;

  const href = productPath(input.slug);
  const title = "Favori ürününüz indirimde";
  const priceLine =
    input.newPrice + PRICE_DROP_MIN < input.oldPrice
      ? `${formatPriceTry(input.oldPrice)} → ${formatPriceTry(input.newPrice)}`
      : formatPriceTry(input.newPrice);
  const body = input.wentOnSale
    ? `${input.name} favorilerinizde ve indirime girdi. Güncel fiyat: ${priceLine}.`
    : `${input.name} favorilerinizde ve fiyatı düştü. Yeni fiyat: ${priceLine}.`;

  const since = new Date(Date.now() - DEDUPE_MS);

  for (const favorite of favorites) {
    const prefs = favorite.user.profile;
    const notifyEmail = prefs?.notifyEmail ?? true;
    const notifySms = prefs?.notifySms ?? false;
    const notifyWhatsapp = prefs?.notifyWhatsapp ?? false;

    const already = await prisma.userNotification.findFirst({
      where: {
        userId: favorite.userId,
        productId: input.productId,
        type: "favorite_discount",
        createdAt: { gte: since },
      },
      select: { id: true },
    });
    if (already) continue;

    await prisma.userNotification.create({
      data: {
        userId: favorite.userId,
        type: "favorite_discount",
        title,
        body,
        href,
        productId: input.productId,
      },
    });

    if (notifyEmail) {
      const url = `${siteUrl()}${href.endsWith("/") ? href : `${href}/`}`;
      await safeNotify(
        notifyFavoriteDiscountMail({
          to: favorite.user.email,
          name: favorite.user.name,
          productName: input.name,
          productUrl: url,
          priceLine,
          body,
        }),
      );
    }

    if (notifySms || notifyWhatsapp) {
      console.info("favorite-alert channel queued", {
        userId: favorite.userId,
        productId: input.productId,
        sms: notifySms,
        whatsapp: notifyWhatsapp,
        phone: favorite.user.phone ? "set" : "missing",
      });
    }
  }
}
