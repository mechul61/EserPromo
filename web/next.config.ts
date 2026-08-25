import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  serverExternalPackages: ["iyzipay"],
  async redirects() {
    return [
      {
        source: "/promosyon-urunleri/",
        destination: "/promosyon/",
        permanent: true,
      },
      // Eski WooCommerce sayfalama → temiz katalog
      {
        source: "/urunler/page/:page/",
        destination: "/urunler/",
        permanent: true,
      },
      {
        source: "/product-category/:slug/page/:page/",
        destination: "/product-category/:slug/",
        permanent: true,
      },
      // Eski iç içe kategori URL'leri → yaprak slug
      {
        source: "/product-category/:parent/:child/",
        destination: "/product-category/:child/",
        permanent: true,
      },
      {
        source: "/product-category/:parent/:child/page/:page/",
        destination: "/product-category/:child/",
        permanent: true,
      },
      // Eski WooCommerce özellik/filtre sayfaları
      {
        source: "/ie-nt-ebat/:path*",
        destination: "/urunler/",
        permanent: true,
      },
      {
        source: "/ie-nt-renk/:path*",
        destination: "/urunler/",
        permanent: true,
      },
      {
        source: "/product-tag/:path*",
        destination: "/urunler/",
        permanent: true,
      },
      // Eski WordPress teknik path'leri
      {
        source: "/wp-admin/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-includes/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/wp-content/:path*",
        destination: "/",
        permanent: true,
      },
      // Bozuk crawl URL
      {
        source: "/$",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Iyzico / harici paneller sıkça /logo.png bekler
      { source: "/logo.png", destination: "/brand/logo.png" },
      { source: "/logo.png/", destination: "/brand/logo.png" },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const isHttps = (process.env.SITE_URL || "").startsWith("https://");
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      isProd
        ? "script-src 'self' 'unsafe-inline' https:"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "connect-src 'self' https: wss:",
      "frame-src https:",
      ...(isHttps ? ["upgrade-insecure-requests"] : []),
    ].join("; ");
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      // Iyzico vb. harici sitelerin merchant logosunu yükleyebilmesi için
      { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
      { key: "Origin-Agent-Cluster", value: "?1" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
      { key: "Content-Security-Policy", value: csp },
    ];
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
