/**
 * Iyzico Checkout Form — kart verisi bu sunucuya gelmez.
 * Anahtarlar gelince iyzipay SDK buraya bağlanır.
 */

import { iyzicoReady } from "../env";

export function assertIyzicoConfigured() {
  if (!iyzicoReady()) {
    throw new Error("Iyzico henüz yapılandırılmadı");
  }
}

export async function startIyzicoPayment(_orderId: string): Promise<never> {
  assertIyzicoConfigured();
  throw new Error("Iyzico entegrasyonu anahtarlar eklendikten sonra açılacak");
}
