import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/promosyon-urunleri/",
        destination: "/promosyon/",
        permanent: true,
      },
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
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
          { key: "Origin-Agent-Cluster", value: "?1" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
