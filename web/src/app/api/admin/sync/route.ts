import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 300;

export async function GET() {
  const runs = await prisma.syncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  const running = runs.find((r) => r.status === "running");
  return NextResponse.json({ runs, isRunning: !!running });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    action: "full" | "categories" | "products" | "single_product" | "stock_prices";
    productId?: number;
  };

  const already = await prisma.syncRun.findFirst({
    where: { status: "running" },
  });
  if (already) {
    return NextResponse.json(
      { error: "Zaten çalışan bir senkron var. Lütfen bitmesini bekleyin." },
      { status: 409 },
    );
  }

  const {
    syncFull,
    syncCategories,
    syncAllProducts,
    syncSingleProduct,
    syncStockPrices,
  } = await import("@/lib/etkin/sync-jobs");

  try {
    let result: Record<string, unknown>;
    switch (body.action) {
      case "full":
        result = await syncFull();
        break;
      case "categories":
        result = await syncCategories();
        break;
      case "products":
        result = await syncAllProducts();
        break;
      case "single_product": {
        if (!body.productId) {
          return NextResponse.json({ error: "productId gerekli." }, { status: 400 });
        }
        result = await syncSingleProduct(body.productId);
        break;
      }
      case "stock_prices":
        result = await syncStockPrices();
        break;
      default:
        return NextResponse.json({ error: "Geçersiz action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
