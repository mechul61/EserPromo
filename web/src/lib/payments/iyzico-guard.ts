import { iyzicoIsReady } from "@/lib/commerce/payments";

export async function assertIyzicoConfigured() {
  if (!(await iyzicoIsReady())) {
    throw new Error("Iyzico henüz yapılandırılmadı");
  }
}
