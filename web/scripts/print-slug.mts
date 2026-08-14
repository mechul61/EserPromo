import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const x = await p.product.findUnique({ where: { id: 4517 } });
console.log(JSON.stringify({ slug: x?.slug, id: x?.id }, null, 2));
await p.$disconnect();
