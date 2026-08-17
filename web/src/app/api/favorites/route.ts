import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listFavoriteIds,
  listFavoriteProducts,
  mergeFavoriteIds,
  toggleFavorite,
} from "@/lib/commerce/favorites";
import { assertSameOrigin, jsonError } from "@/lib/security/origin";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ authenticated: false, productIds: [], items: [], count: 0 });
  }

  const full = req.nextUrl.searchParams.get("full") === "1";
  const productIds = await listFavoriteIds(user.id);
  const items = full ? await listFavoriteProducts(user.id) : [];
  return Response.json({
    authenticated: true,
    productIds,
    items,
    count: productIds.length,
  });
}

const toggleSchema = z.object({
  productId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const body = toggleSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz ürün");

  try {
    const result = await toggleFavorite(user.id, body.data.productId);
    const productIds = await listFavoriteIds(user.id);
    return Response.json({
      authenticated: true,
      ...result,
      productIds,
      count: productIds.length,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Favori güncellenemedi");
  }
}

const syncSchema = z.object({
  productIds: z.array(z.number().int().positive()).max(100),
});

export async function PUT(req: NextRequest) {
  try {
    assertSameOrigin(req);
  } catch {
    return jsonError("Geçersiz istek", 403);
  }

  const user = await getCurrentUser();
  if (!user) return jsonError("Giriş yapın.", 401);

  const body = syncSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return jsonError("Geçersiz istek");

  const productIds = await mergeFavoriteIds(user.id, body.data.productIds);
  return Response.json({
    authenticated: true,
    productIds,
    count: productIds.length,
  });
}
