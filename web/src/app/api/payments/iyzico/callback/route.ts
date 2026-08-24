import { NextRequest, NextResponse } from "next/server";
import { finalizeIyzicoCheckout } from "@/lib/payments/iyzico";
import { siteUrl } from "@/lib/env";

export async function POST(req: NextRequest) {
  let token = "";
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    token = String(form.get("token") ?? "");
  } else {
    const body = (await req.json().catch(() => null)) as { token?: string } | null;
    token = String(body?.token ?? "");
  }

  try {
    const result = await finalizeIyzicoCheckout(token);
    const url = new URL(`/siparislerim/${result.orderNumber}/`, siteUrl());
    url.searchParams.set("odeme", result.paymentStatus === "success" ? "basarili" : "basarisiz");
    if (!result.ok && "message" in result && result.message) {
      url.searchParams.set("mesaj", result.message.slice(0, 120));
    }
    return NextResponse.redirect(url, 303);
  } catch (error) {
    const url = new URL("/siparislerim/", siteUrl());
    url.searchParams.set("odeme", "hata");
    url.searchParams.set(
      "mesaj",
      (error instanceof Error ? error.message : "Ödeme sonucu işlenemedi").slice(0, 120),
    );
    return NextResponse.redirect(url, 303);
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const request = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ token }),
  });
  return POST(request);
}
