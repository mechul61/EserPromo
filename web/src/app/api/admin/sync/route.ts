import { after, NextResponse } from "next/server";
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

  if (body.action === "single_product" && !body.productId) {
    return NextResponse.json({ error: "productId gerekli." }, { status: 400 });
  }

  const runJob = async () => {
    switch (body.action) {
      case "full":
        return syncFull();
      case "categories":
        return syncCategories();
      case "products":
        return syncAllProducts();
      case "single_product":
        return syncSingleProduct(body.productId!);
      case "stock_prices":
        return syncStockPrices();
      default:
        return null;
    }
  };

  if (body.action !== "full" && body.action !== "categories" && body.action !== "products" && body.action !== "single_product" && body.action !== "stock_prices") {
    return NextResponse.json({ error: "Geçersiz action." }, { status: 400 });
  }

  if (body.action === "single_product") {
    try {
      const result = await syncSingleProduct(body.productId!);
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }
  }

  after(() => {
    runJob().catch((error) => {
      console.error("[sync] background", error);
    });
  });

  return NextResponse.json({ ok: true, started: true });
}
