import { NextRequest, NextResponse } from "next/server";
import { finalizeIyzicoCheckout } from "@/lib/payments/iyzico";
import { siteUrl } from "@/lib/env";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resultHtml(input: {
  ok: boolean;
  orderNumber: string;
  paymentStatus: string;
  message?: string;
  redirectUrl: string;
}) {
  const payload = {
    source: "eserpromo-iyzico",
    ok: input.ok,
    orderNumber: input.orderNumber,
    paymentStatus: input.paymentStatus,
    message: input.message ?? "",
  };
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  const title = input.ok ? "Ödeme başarılı" : "Ödeme sonucu";
  const bodyText = input.ok
    ? "Ödemeniz alındı. Bu pencere kapanıyor…"
    : escapeHtml(input.message || "Ödeme tamamlanamadı. Bu pencereyi kapatabilirsiniz.");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f5f7fa;color:#111;padding:24px;text-align:center}
    p{max-width:28rem;line-height:1.5;font-size:15px}
  </style>
</head>
<body>
  <p>${bodyText}</p>
  <script>
    (function () {
      var payload = ${json};
      var target = ${JSON.stringify(input.redirectUrl)};
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, window.location.origin);
          window.close();
          return;
        }
      } catch (e) {}
      window.location.replace(target);
    })();
  </script>
</body>
</html>`;
}

async function handleCallback(token: string) {
  try {
    const result = await finalizeIyzicoCheckout(token);
    const url = new URL(`/siparislerim/${result.orderNumber}/`, siteUrl());
    url.searchParams.set("odeme", result.paymentStatus === "success" ? "basarili" : "basarisiz");
    if (!result.ok && "message" in result && result.message) {
      url.searchParams.set("mesaj", result.message.slice(0, 120));
    }
    return new NextResponse(
      resultHtml({
        ok: result.ok,
        orderNumber: result.orderNumber,
        paymentStatus: result.paymentStatus,
        message: "message" in result ? result.message : undefined,
        redirectUrl: url.toString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const url = new URL("/siparislerim/", siteUrl());
    url.searchParams.set("odeme", "hata");
    const message = (error instanceof Error ? error.message : "Ödeme sonucu işlenemedi").slice(0, 120);
    url.searchParams.set("mesaj", message);
    return new NextResponse(
      resultHtml({
        ok: false,
        orderNumber: "",
        paymentStatus: "error",
        message,
        redirectUrl: url.toString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

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

  return handleCallback(token);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  return handleCallback(token);
}
