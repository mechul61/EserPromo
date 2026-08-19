import { z } from "zod";

export const CUSTOMER_GROUPS = ["retail", "wholesale", "vip"] as const;
export const CUSTOMER_SOURCES = ["website", "social", "email", "other"] as const;

export const customerWriteSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  city: z.string().trim().max(40).optional().or(z.literal("")),
  customerGroup: z.enum(CUSTOMER_GROUPS).optional(),
  source: z.enum(CUSTOMER_SOURCES).optional(),
  isActive: z.boolean().optional(),
  blocked: z.boolean().optional(),
  password: z.string().min(8).max(72).optional(),
});

export function parseCustomerGroup(value: string | undefined): (typeof CUSTOMER_GROUPS)[number] {
  const raw = (value ?? "retail").toLowerCase();
  if (raw.includes("vip")) return "vip";
  if (raw.includes("toptan") || raw.includes("wholesale")) return "wholesale";
  return "retail";
}

export function parseCustomerSource(value: string | undefined): (typeof CUSTOMER_SOURCES)[number] {
  const raw = (value ?? "website").toLowerCase();
  if (raw.includes("sosyal") || raw.includes("social")) return "social";
  if (raw.includes("posta") || raw.includes("email") || raw.includes("kampanya")) return "email";
  if (raw.includes("diğer") || raw.includes("diger") || raw.includes("other")) return "other";
  return "website";
}
