/**
 * Iyzico Checkout Form — kart verisi bu sunucuya gelmez.
 * Anahtarlar gelince iyzipay SDK buraya bağlanır.
 */

import { iyzicoIsReady } from "../commerce/payments";

export async function assertIyzicoConfigured() {
  if (!(await iyzicoIsReady())) {
    throw new Error("Iyzico henüz yapılandırılmadı");
  }
}

export async function startIyzicoPayment(): Promise<never> {
  await assertIyzicoConfigured();
  throw new Error("Iyzico entegrasyonu anahtarlar eklendikten sonra açılacak");
}
