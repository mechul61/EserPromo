import { prisma } from "@/lib/db";

export async function deleteAdminOrder(orderId: string) {
  return prisma.order.delete({ where: { id: orderId } });
}

export { orderHasSuccessfulPayment } from "@/lib/commerce/orders-copy";
