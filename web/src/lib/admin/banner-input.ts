import { z } from "zod";

export const BANNER_KINDS = ["banner", "slider"] as const;
export const BANNER_PLACEMENTS = ["hero", "middle_1", "middle_2", "bottom", "side", "category"] as const;

export const bannerWriteSchema = z.object({
  kind: z.enum(BANNER_KINDS).optional(),
  title: z.string().trim().min(2).max(120),
  href: z.string().trim().max(300).optional().or(z.literal("")),
  imagePath: z.string().trim().min(1).max(400),
  width: z.number().int().min(1).max(8000).optional(),
  height: z.number().int().min(1).max(8000).optional(),
  placement: z.enum(BANNER_PLACEMENTS).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  minAmount: z.number().min(0).max(1_000_000).optional(),
  maxAmount: z.number().min(0).max(1_000_000).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  views: z.number().int().min(0).optional(),
});

export const bannerPatchSchema = bannerWriteSchema.partial();

export function parseOptionalDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
