import { z } from "zod";

export const POPUP_KINDS = ["subscribe", "promo", "info"] as const;
export const POPUP_PLACEMENTS = ["home", "all", "category", "product", "cart"] as const;
export const POPUP_DEVICES = ["all", "desktop", "mobile"] as const;
export const POPUP_AUDIENCES = ["all", "new_visitors", "returning", "logged_in"] as const;

export const popupWriteSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  kind: z.enum(POPUP_KINDS).optional(),
  placement: z.enum(POPUP_PLACEMENTS).optional(),
  device: z.enum(POPUP_DEVICES).optional(),
  audience: z.enum(POPUP_AUDIENCES).optional(),
  isDraft: z.boolean().optional(),
  isActive: z.boolean().optional(),
  imagePath: z.string().trim().max(400).optional().or(z.literal("")),
  heading: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().max(600).optional().or(z.literal("")),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  ctaHref: z.string().trim().max(300).optional().or(z.literal("")),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  delaySeconds: z.number().int().min(0).max(120).optional(),
  frequencyHours: z.number().int().min(0).max(8760).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export const popupPatchSchema = popupWriteSchema.partial();

export function parseOptionalDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
