import type { SquareOrderForSync, SquarePaymentForSync } from "./map-payment";
import { SQUARE_API_VERSION, squareApiBaseUrl } from "./urls";

export async function getSquarePayment(
  accessToken: string,
  paymentId: string,
): Promise<SquarePaymentForSync | null> {
  const res = await fetch(
    `${squareApiBaseUrl()}/v2/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": SQUARE_API_VERSION,
      },
    },
  );

  const json = (await res.json()) as {
    payment?: SquarePaymentForSync;
    errors?: unknown[];
  };

  if (!res.ok || json.errors?.length || !json.payment) {
    return null;
  }

  return json.payment;
}

export async function getSquareOrder(
  accessToken: string,
  orderId: string,
): Promise<SquareOrderForSync | null> {
  const res = await fetch(
    `${squareApiBaseUrl()}/v2/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": SQUARE_API_VERSION,
      },
    },
  );

  const json = (await res.json()) as {
    order?: SquareOrderForSync;
    errors?: unknown[];
  };

  if (!res.ok || json.errors?.length || !json.order) {
    return null;
  }

  return json.order;
}
