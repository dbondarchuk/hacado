import { getLoggerFactory } from "@hacado/logger";
import { formatAmountString } from "@hacado/utils";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";
import { OrdersCapture, PaypalOrder } from "./types";

export class PaypalClient {
  url: string;
  accessToken: string | null = null;
  expiresAt: number | null = null;

  private readonly loggerFactory = getLoggerFactory("PaypalClient");

  constructor(
    private readonly clientId: string,
    private readonly secretKey: string,
    isProduction: boolean,
    // private readonly appUrl: string
  ) {
    this.url = isProduction
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  }

  private fetcher = async (
    endpoint: string,
    init?: RequestInit | undefined,
  ) => {
    await this.getAccessToken();
    return fetch(`${this.url}${endpoint}`, {
      method: "get",
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        ...init?.headers,
      },
    });
  };

  public async getAccessToken(): Promise<void> {
    if (this.accessToken && this.expiresAt && this.expiresAt > Date.now()) {
      return;
    }
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.secretKey}`).toString("base64")}`,
    };

    const body = new URLSearchParams();
    body.append("grant_type", "client_credentials");

    try {
      const response = await fetch(`${this.url}/v1/oauth2/token`, {
        method: "POST",
        headers,
        body,
      });
      if (response.ok) {
        const { access_token, expires_in } = await response.json();
        this.accessToken = access_token;
        this.expiresAt = Date.now() + expires_in;
      } else if (response?.status) {
        console.error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Orders
  public async createOrder({
    referenceId,
    amount,
    currency,
    // returnUrl,
    // cancelUrl,
    intent = "CAPTURE",
  }: {
    referenceId?: string;
    amount: number;
    currency: string;
    // returnUrl: string;
    // cancelUrl: string;
    intent?: "CAPTURE" | "AUTHORIZE";
  }): Promise<
    | { order: CreateOrderResponse; error?: never }
    | { order?: never; error: { statusCode?: number } }
  > {
    const logger = this.loggerFactory("createOrder");
    const createOrderRequestBody: CreateOrderRequestBody = {
      intent,
      purchase_units: [
        {
          reference_id: referenceId,
          amount: {
            currency_code: currency,
            value: formatAmountString(amount),
          },
        },
      ],
      //   payment_source: {
      //     paypal: {
      //       experience_context: {
      //         user_action: "PAY_NOW",
      //         return_url: returnUrl,
      //         cancel_url: cancelUrl,
      //       },
      //     },
      //   },
    };

    let response: Response | undefined;

    try {
      response = await this.fetcher("/v2/checkout/orders", {
        method: "POST",
        headers: {
          "PayPal-Request-Id": uuidv4(),
        },
        body: JSON.stringify(createOrderRequestBody),
      });

      if (response.ok) {
        const createOrderResponse: CreateOrderResponse = await response.json();
        return { order: createOrderResponse };
      }

      throw new Error("Request has failed");
    } catch (error) {
      logger.error({ error, response }, "Request to create order has failed");
      return { error: { statusCode: response?.status } };
    }
  }

  public async captureOrder(
    orderId: string,
  ): Promise<
    | { order: PaypalOrder; error?: never }
    | { order?: never; error: { statusCode?: number } }
  > {
    const logger = this.loggerFactory("captureOrder");
    let response: Response | undefined;
    let result: PaypalOrder | undefined;
    try {
      response = await this.fetcher(`/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
      });

      if (response.ok) {
        result = (await response.json()) as PaypalOrder;
        if (result?.status === "COMPLETED") {
          return { order: result };
        }
      }

      throw new Error("Request to create order has failed");
    } catch (error) {
      logger.error(
        { response, result, error },
        "Request to create order has failed",
      );

      return { error: { statusCode: response?.status } };
    }
  }

  public async getOrder(
    orderId: string,
  ): Promise<
    | { order: PaypalOrder; error?: never }
    | { order?: never; error: { statusCode?: number } }
  > {
    const logger = this.loggerFactory("getOrder");
    let response: Response | undefined;
    let result: PaypalOrder | undefined;
    try {
      response = await this.fetcher(`/v2/checkout/orders/${orderId}`, {
        method: "GET",
      });

      if (response.ok) {
        result = (await response.json()) as PaypalOrder;
        return { order: result };
      }

      throw new Error("Request to get order has failed");
    } catch (error) {
      logger.error(
        { response, result, error },
        "Request to get order has failed",
      );

      return { error: { statusCode: response?.status } };
    }
  }

  public async getCapture(
    captureId: string,
  ): Promise<
    | { capture: OrdersCapture; error?: never }
    | { capture?: never; error: { statusCode?: number } }
  > {
    const logger = this.loggerFactory("getCapture");
    let response: Response | undefined;
    let result: OrdersCapture | undefined;
    try {
      response = await this.fetcher(`/v2/payments/captures/${captureId}`, {
        method: "GET",
      });

      if (response.ok) {
        result = (await response.json()) as OrdersCapture;
        return { capture: result };
      }

      throw new Error("Request to get capture has failed");
    } catch (error) {
      logger.debug(
        { captureId, statusCode: response?.status, error },
        "Request to get capture has failed",
      );

      return { error: { statusCode: response?.status } };
    }
  }

  public async refundPayment(
    captureId: string,
    amount: number,
    currency: string,
  ): Promise<
    { ok: true; error?: never } | { ok: false; error: { statusCode?: number } }
  > {
    const logger = this.loggerFactory("refundPayment");
    let response: Response | undefined;
    try {
      response = await this.fetcher(
        `/v2/payments/captures/${captureId}/refund`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: {
              currency_code: currency,
              value: formatAmountString(amount),
            },
          }),
        },
      );

      if (response.ok) {
        return { ok: true };
      }

      throw new Error("Request to get order has failed");
    } catch (error) {
      logger.error({ response, error }, "Request to get order has failed");

      return { ok: false, error: { statusCode: response?.status } };
    }
  }

  /**
   * Registers a PayPal webhook for the given listener URL. Used to sync
   * in-store card payments. Returns the PayPal-generated webhook id, which is
   * required later to verify webhook signatures.
   *
   * If a webhook already exists for the URL (PayPal rejects duplicates), the
   * existing webhook id is reused.
   */
  public async createWebhook(
    url: string,
    eventTypes: string[] = ["PAYMENT.CAPTURE.COMPLETED"],
  ): Promise<string | undefined> {
    const logger = this.loggerFactory("createWebhook");
    const body = {
      url,
      event_types: eventTypes.map((name) => ({ name })),
    };

    let response: Response | undefined;
    try {
      response = await this.fetcher(`/v1/notifications/webhooks`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        return result.id as string;
      }

      // PayPal returns 400 WEBHOOK_URL_ALREADY_EXISTS when the URL is taken;
      // reuse the existing subscription instead of failing the connection.
      const existing = await this.findWebhookIdByUrl(url);
      if (existing) {
        return existing;
      }

      const message = `${response.statusText}: ${JSON.stringify(await response.json())}`;
      throw new Error(message);
    } catch (error) {
      logger.error(
        { error, statusCode: response?.status },
        "Error creating PayPal webhook",
      );
      return undefined;
    }
  }

  /** Returns the id of the webhook whose URL exactly matches, if any. */
  public async findWebhookIdByUrl(url: string): Promise<string | undefined> {
    const ids = await this.listWebhooks(url);
    return ids[0];
  }

  /**
   * Lists webhook ids, optionally filtered to those whose URL contains
   * `urlFilter`.
   */
  async listWebhooks(urlFilter?: string): Promise<string[]> {
    try {
      const response = await this.fetcher(`/v1/notifications/webhooks`);

      if (response.ok) {
        const { webhooks } = await response.json();

        return (webhooks as { id: string; url: string }[])
          .filter((webhook) =>
            urlFilter ? webhook.url.includes(urlFilter) : true,
          )
          .map((webhook) => webhook.id);
      }
    } catch (error) {
      console.error(error);
      return [];
    }
    return [];
  }

  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      const response = await this.fetcher(
        `/v1/notifications/webhooks/${webhookId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.error(error);
    }
    return false;
  }

  async test(): Promise<boolean> {
    // Always get a new access token
    try {
      await this.getAccessToken();
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  /**
   * Lists balance-affecting successful transactions in a date range via the
   * Transaction Search API. Paginates a single page; use
   * {@link listAllTransactions} to fetch every page in the window.
   */
  public async listTransactions({
    startDate,
    endDate,
    page = 1,
    pageSize = 100,
  }: {
    startDate: Date;
    endDate: Date;
    page?: number;
    pageSize?: number;
  }): Promise<ListTransactionsResult> {
    const logger = this.loggerFactory("listTransactions");
    const params = new URLSearchParams({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      transaction_status: "S",
      balance_affecting_records_only: "Y",
      fields: "transaction_info,store_info,cart_info",
      page: String(page),
      page_size: String(Math.min(Math.max(pageSize, 1), 500)),
    });

    let response: Response | undefined;
    try {
      response = await this.fetcher(
        `/v1/reporting/transactions?${params.toString()}`,
        { method: "GET" },
      );

      if (response.ok) {
        const body = (await response.json()) as ListTransactionsResponse;
        return {
          transactionDetails: body.transaction_details ?? [],
          totalPages: body.total_pages ?? 1,
          totalItems: body.total_items ?? 0,
        };
      }

      throw new Error(`Request failed with status ${response.status}`);
    } catch (error) {
      logger.error(
        { error, statusCode: response?.status },
        "Failed to list PayPal transactions",
      );
      return { error: { statusCode: response?.status } };
    }
  }

  /** Fetches every page of transactions in the given date range. */
  public async listAllTransactions(
    startDate: Date,
    endDate: Date,
  ): Promise<ListTransactionsResult> {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const transactionDetails: PaypalTransactionDetail[] = [];

    while (page <= totalPages) {
      const result = await this.listTransactions({
        startDate,
        endDate,
        page,
        pageSize,
      });

      if (result.error) {
        return result;
      }

      transactionDetails.push(...result.transactionDetails);
      totalPages = result.totalPages;
      page += 1;
    }

    return {
      transactionDetails,
      totalPages: totalPages - 1 || 1,
      totalItems: transactionDetails.length,
    };
  }

  async verifyWebhook(options: WebhookEventVerifyRequest): Promise<void> {
    const parseRequest = webhookEventVerifyRequestSchema.safeParse(options);

    // Webhook event should be parsable
    if (!parseRequest.success) {
      console.error(parseRequest.error);
      throw new Error("Request is malformed");
    }

    const stringy = JSON.stringify({
      auth_algo: options.body.auth_algo,
      cert_url: options.body.cert_url,
      transmission_id: options.body.transmission_id,
      transmission_sig: options.body.transmission_sig,
      transmission_time: options.body.transmission_time,
      webhook_id: options.body.webhook_id,
    });

    const bodyToString = `${stringy.slice(0, -1)},"webhook_event":${options.body.webhook_event}}`;

    try {
      const response = await this.fetcher(
        `/v1/notifications/verify-webhook-signature`,
        {
          method: "POST",
          body: bodyToString,
        },
      );

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();

      if (data.verification_status !== "SUCCESS") {
        throw data;
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

interface PurchaseUnit {
  amount: {
    currency_code: string;
    value: string;
  };
  reference_id?: string;
}

interface ExperienceContext {
  payment_method_preference?: string;
  payment_method_selected?: string;
  brand_name?: string;
  locale?: string;
  landing_page?: string;
  shipping_preference?: string;
  user_action: string;
  return_url: string;
  cancel_url: string;
}

interface PaymentSource {
  paypal: {
    experience_context: ExperienceContext;
  };
}

interface CreateOrderRequestBody {
  purchase_units: PurchaseUnit[];
  intent: string;
  payment_source?: PaymentSource;
}

interface Link {
  href: string;
  rel: string;
  method: string;
}

interface CreateOrderResponse {
  id: string;
  status: string;
  payment_source: PaymentSource;
  links: Link[];
}

const webhookEventVerifyRequestSchema = z.object({
  body: z
    .object({
      auth_algo: z.string(),
      cert_url: z.string(),
      transmission_id: z.string(),
      transmission_sig: z.string(),
      transmission_time: z.string(),
      webhook_event: z.string(),
      webhook_id: z.string(),
    })
    .required(),
});

export type WebhookEventVerifyRequest = z.infer<
  typeof webhookEventVerifyRequestSchema
>;

export type PaypalMoneyAmount = {
  currency_code?: string;
  value?: string;
};

export type PaypalTransactionInfo = {
  transaction_id?: string;
  paypal_reference_id?: string;
  paypal_reference_id_type?: string;
  transaction_initiation_date?: string;
  transaction_amount?: PaypalMoneyAmount;
  fee_amount?: PaypalMoneyAmount;
  transaction_status?: string;
};

export type PaypalStoreInfo = {
  store_id?: string;
  terminal_id?: string;
};

export type PaypalCartItemDetail = {
  total_item_amount?: PaypalMoneyAmount;
};

export type PaypalCartInfo = {
  item_details?: PaypalCartItemDetail[];
};

export type PaypalTransactionDetail = {
  transaction_info?: PaypalTransactionInfo;
  store_info?: PaypalStoreInfo;
  cart_info?: PaypalCartInfo;
};

type ListTransactionsResponse = {
  transaction_details?: PaypalTransactionDetail[];
  total_pages?: number;
  total_items?: number;
};

export type ListTransactionsResult =
  | {
      transactionDetails: PaypalTransactionDetail[];
      totalPages: number;
      totalItems: number;
      error?: never;
    }
  | {
      transactionDetails?: never;
      totalPages?: never;
      totalItems?: never;
      error: { statusCode?: number };
    };
