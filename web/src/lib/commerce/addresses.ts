import { prisma } from "../db";

export type AddressPayload = {
  title?: string;
  fullName: string;
  email?: string;
  phone: string;
  country?: string;
  city: string;
  district: string;
  postalCode?: string;
  line: string;
  isDefault?: boolean;
};

export async function saveUserAddress(userId: string, payload: AddressPayload) {
  const title = payload.title ?? "Teslimat";
  const isDefault = payload.isDefault ?? title === "Teslimat";
  const data = {
    fullName: payload.fullName.trim(),
    email: payload.email?.trim() ?? "",
    phone: payload.phone.trim(),
    country: payload.country?.trim() || "Türkiye",
    city: payload.city.trim(),
    district: payload.district.trim(),
    postalCode: payload.postalCode?.trim() ?? "",
    line: payload.line.trim(),
    isDefault,
  };

  if (isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  const existing = await prisma.address.findFirst({
    where: { userId, title },
    select: { id: true },
  });

  if (existing) {
    return prisma.address.update({ where: { id: existing.id }, data });
  }

  return prisma.address.create({
    data: { userId, title, ...data },
  });
}
