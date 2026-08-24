import type { IyzicoConfig } from "@/lib/commerce/payments";

export type IyzicoApiResult = {
  status: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
  locale?: string;
  systemTime?: number;
  conversationId?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  paymentStatus?: string;
  paymentId?: string;
  fraudStatus?: number;
  price?: number;
  paidPrice?: number;
  currency?: string;
  installment?: number;
  basketId?: string;
};

type IyzipayClient = {
  checkoutFormInitialize: {
    create: (
      request: Record<string, unknown>,
      cb: (err: Error | null, result: IyzicoApiResult) => void,
    ) => void;
  };
  checkoutForm: {
    retrieve: (
      request: Record<string, unknown>,
      cb: (err: Error | null, result: IyzicoApiResult) => void,
    ) => void;
  };
};

function promisify<T extends IyzicoApiResult>(
  run: (cb: (err: Error | null, result: T) => void) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    run((err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}

export function createIyzipayClient(config: IyzicoConfig): IyzipayClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Iyzipay = require("iyzipay") as new (options: {
    apiKey: string;
    secretKey: string;
    uri: string;
  }) => IyzipayClient;
  return new Iyzipay({
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    uri: config.uri,
  });
}

export async function iyzicoCheckoutInitialize(
  client: IyzipayClient,
  request: Record<string, unknown>,
): Promise<IyzicoApiResult> {
  return promisify((cb) => client.checkoutFormInitialize.create(request, cb));
}

export async function iyzicoCheckoutRetrieve(
  client: IyzipayClient,
  request: Record<string, unknown>,
): Promise<IyzicoApiResult> {
  return promisify((cb) => client.checkoutForm.retrieve(request, cb));
}
