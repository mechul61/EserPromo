export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim().slice(0, 64) ?? "";
  }
  return (req.headers.get("x-real-ip") ?? "").trim().slice(0, 64);
}

export function deviceLabel(userAgent: string) {
  const ua = userAgent || "";
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac OS") || ua.includes("Macintosh")
      ? "Mac"
      : ua.includes("Android")
        ? "Android"
        : ua.includes("iPhone") || ua.includes("iPad")
          ? "iOS"
          : "Cihaz";
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
      ? "Chrome"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Safari/")
          ? "Safari"
          : "Tarayıcı";
  return `${browser} · ${os}`;
}

export function formatDateTimeTr(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
