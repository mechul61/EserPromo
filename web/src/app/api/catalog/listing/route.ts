import type { NextRequest } from "next/server";
import {
  getCatalogListingResult,
  parseCatalogListingScope,
} from "@/lib/catalog-listing-query";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const scope = parseCatalogListingScope(params.get("scope"), params.get("q"));
  if (!scope) {
    return Response.json({ error: "Geçersiz kapsam" }, { status: 400 });
  }

  const page = Number.parseInt(params.get("page") ?? "1", 10) || 1;
  const renk = params.getAll("renk").filter(Boolean);
  const ebat = params.getAll("ebat").filter(Boolean);
  const sira = params.get("sira") ?? undefined;

  const result = await getCatalogListingResult(scope, { renk, ebat, sira, page });

  return Response.json(
    {
      items: result.pageItems,
      page: result.page,
      pageCount: result.pageCount,
      total: result.total,
    },
    {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" },
    },
  );
}
