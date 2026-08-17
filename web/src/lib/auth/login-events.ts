import { prisma } from "../db";
import { clientIp } from "./login-meta";

export async function recordLoginEvent(
  userId: string,
  email: string,
  req: Request,
  source: "login" | "register" = "login",
) {
  await prisma.loginEvent.create({
    data: {
      userId,
      email,
      source,
      ip: clientIp(req),
      userAgent: (req.headers.get("user-agent") ?? "").slice(0, 255),
    },
  });
}

export async function listLoginEvents(userId: string, email: string) {
  const existing = await prisma.loginEvent.count({ where: { userId } });
  if (existing === 0) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    if (sessions.length) {
      await prisma.loginEvent.createMany({
        data: sessions.map((session) => ({
          userId,
          email,
          source: "login",
          createdAt: session.createdAt,
        })),
      });
    }
  }

  return prisma.loginEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
