import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  ApiResponse,
  AppJobRequest,
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  IConnectedApp,
  IConnectedAppProps,
  IConnectedAppWithWebhook,
  IPaymentProcessor,
  IScheduled,
  Payment,
  PaymentFee,
  SyncedPaymentTransaction,
  systemEventSource,
} from "@hacado/types";
import { decrypt, encrypt, getAppsExternalUrl, maskify } from "@hacado/utils";
import { Environment } from "@paypal/paypal-server-sdk";
import {
  APPLE_PAY_DOMAIN_ASSOCIATION_PRODUCTION,
  APPLE_PAY_DOMAIN_ASSOCIATION_SANDBOX,
} from "./apple-pay";
import { PaypalClient } from "./client";
import {
  getPaypalTransactionSyncSchedulerId,
  PAYPAL_APP_NAME,
  PAYPAL_TRANSACTION_SYNC_INTERVAL_SECONDS,
  PAYPAL_TRANSACTION_SYNC_JOB_TYPE,
} from "./const";
import {
  CaptureOrderRequest,
  captureOrderRequestSchema,
  CreateOrderRequest,
  createOrderRequestSchema,
  PaypalConfiguration,
  paypalConfigurationSchema,
  PaypalFormProps,
  PaypalJobPayload,
} from "./models";
import {
  InStoreCaptureIngestResult,
  InStoreCaptureInput,
  runPaypalTransactionSync,
} from "./transaction-sync";
import {
  PaypalAdminAllKeys,
  PaypalAdminKeys,
  PaypalAdminNamespace,
} from "./translations/types";

export const MASKED_SECRET_KEY = "this-is-a-masked-secret-key";

const IN_STORE_SYNC_EVENT_TYPES = ["PAYMENT.CAPTURE.COMPLETED"];

class PaypalConnectedApp
  implements
    IConnectedApp<PaypalConfiguration>,
    IConnectedAppWithWebhook<PaypalConfiguration>,
    IPaymentProcessor,
    IScheduled
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "PaypalConnectedApp",
      props.organizationId,
    );
  }

  public async processAppData(
    appData: PaypalConfiguration,
  ): Promise<PaypalConfiguration> {
    return {
      ...appData,
      enableGooglePay: appData.enableGooglePay ?? false,
      enableApplePay: appData.enableApplePay ?? false,
      secretKey: appData.secretKey ? MASKED_SECRET_KEY : "",
      clientId: appData.clientId ? MASKED_SECRET_KEY : "",
    };
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: PaypalConfiguration,
  ): Promise<
    ConnectedAppStatusWithText<PaypalAdminNamespace, PaypalAdminKeys>
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id },
      "Processing PayPal configuration request",
    );

    const { data, success, error } =
      paypalConfigurationSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid PayPal configuration request");
      throw new ConnectedAppRequestError(
        "invalid_paypal_configuration_request",
        { error },
        400,
        error.message,
      );
    }

    if (data.secretKey === MASKED_SECRET_KEY && appData?.data?.secretKey) {
      data.secretKey = appData.data.secretKey;
    } else if (data.secretKey) {
      data.secretKey = encrypt(data.secretKey);
    }

    if (data.clientId === MASKED_SECRET_KEY && appData?.data?.clientId) {
      data.clientId = appData.data.clientId;
    } else if (data.clientId) {
      data.clientId = encrypt(data.clientId);
    }

    try {
      if (!paypalConfigurationSchema.safeParse(data).success) {
        logger.error(
          { appId: appData._id },
          "Invalid PayPal configuration data",
        );
        throw new ConnectedAppError(
          "app_paypal_admin.statusText.invalid_configuration_data" satisfies PaypalAdminAllKeys,
        );
      }

      logger.debug({ appId: appData._id }, "Validating PayPal configuration");

      const client = await this.getSimplifiedClient({ data });
      await client.getAccessToken();

      logger.debug(
        { appId: appData._id },
        "Successfully obtained PayPal access token",
      );

      await this.syncWebhookRegistration(appData, data, client);

      if (data.enableInStoreSync) {
        await this.ensureTransactionSyncRepeatableJob(appData._id);
      } else {
        await this.removeTransactionSyncRepeatableJob(appData._id);
      }

      const status: ConnectedAppStatusWithText<
        PaypalAdminNamespace,
        PaypalAdminKeys
      > = {
        status: "connected",
        statusText: "app_paypal_admin.statusText.successfully_connected",
      };

      const decryptedClientId = decrypt(data.clientId);

      this.props.update({
        account: {
          username: maskify(decryptedClientId),
        },
        data,
        ...status,
      });

      logger.info(
        { appId: appData._id, clientId: maskify(decryptedClientId) },
        "Successfully connected to PayPal account",
      );

      return status;
    } catch (e: any) {
      logger.error(
        { appId: appData._id, error: e?.message || e?.toString() },
        "Error processing PayPal configuration request",
      );

      const status: ConnectedAppStatusWithText<
        PaypalAdminNamespace,
        PaypalAdminKeys
      > = {
        status: "failed",
        statusText:
          e instanceof ConnectedAppError
            ? (e.key as PaypalAdminAllKeys)
            : ("app_paypal_admin.statusText.error_processing_configuration" satisfies PaypalAdminAllKeys),
      };

      this.props.update({
        ...status,
      });

      return status;
    }
  }

  public async processAppCall(
    appData: ConnectedAppData,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse | undefined> {
    const logger = this.loggerFactory("processAppCall");
    logger.debug(
      { appId: appData._id, slug, method: request.method },
      "Processing PayPal app call",
    );

    if (
      slug.length === 1 &&
      slug[0] === "orders" &&
      request.method.toUpperCase() === "POST"
    ) {
      logger.debug({ appId: appData._id }, "Creating PayPal order");

      try {
        const body = await request.json();
        const { data, success, error } =
          createOrderRequestSchema.safeParse(body);
        if (!success) {
          logger.error(
            { appId: appData._id, error },
            "Invalid create order request data",
          );
          return Response.json({ success: false, error }, { status: 400 });
        }

        logger.debug(
          { appId: appData._id, paymentIntentId: data.paymentIntentId },
          "Creating PayPal order",
        );

        return await this.createOrder(appData, data);
      } catch (error: any) {
        logger.error(
          { appId: appData._id, error: error?.message || error?.toString() },
          "Error creating PayPal order",
        );
        throw error;
      }
    } else if (
      slug.length === 2 &&
      slug[0] === "orders" &&
      slug[1] === "capture" &&
      request.method.toUpperCase() === "POST"
    ) {
      logger.debug({ appId: appData._id }, "Capturing PayPal order");

      try {
        const body = await request.json();
        const { data, success, error } =
          captureOrderRequestSchema.safeParse(body);
        if (!success) {
          logger.error(
            { appId: appData._id, error },
            "Invalid capture order request data",
          );
          return Response.json({ success: false, error }, { status: 400 });
        }

        logger.debug(
          {
            appId: appData._id,
            orderId: data.orderId,
            paymentIntentId: data.paymentIntentId,
          },
          "Capturing PayPal order",
        );

        return await this.captureOrder(appData, data);
      } catch (error: any) {
        logger.error(
          { appId: appData._id, error: error?.message || error?.toString() },
          "Error capturing PayPal order",
        );
        throw error;
      }
    }

    logger.debug(
      { appId: appData._id, slug },
      "No matching PayPal app call handler found",
    );

    return undefined;
  }

  /** Builds the per-install webhook listener URL. */
  protected getWebhookUrl(appId: string): string {
    return `${getAppsExternalUrl()}/api/webhooks/apps/id/${this.props.organizationId}/${appId}`;
  }

  /**
   * Registers or removes the in-store sync webhook to match the merchant's
   * `enableInStoreSync` preference, persisting the resulting webhook id on
   * `data` so it can be reused for signature verification.
   */
  protected async syncWebhookRegistration(
    appData: ConnectedAppData,
    data: PaypalConfiguration,
    client: PaypalClient,
  ): Promise<void> {
    const logger = this.loggerFactory("syncWebhookRegistration");

    if (data.enableInStoreSync) {
      const webhookUrl = this.getWebhookUrl(appData._id);
      const webhookId = await client.createWebhook(
        webhookUrl,
        IN_STORE_SYNC_EVENT_TYPES,
      );

      if (webhookId) {
        data.webhookId = webhookId;
        logger.info(
          { appId: appData._id, webhookId },
          "Registered PayPal in-store sync webhook",
        );
      } else {
        logger.warn(
          { appId: appData._id },
          "Failed to register PayPal in-store sync webhook",
        );
      }
      return;
    }

    // Sync disabled: best-effort cleanup of any previously registered webhook.
    const existingWebhookId = appData.data?.webhookId ?? data.webhookId;
    if (existingWebhookId) {
      try {
        await client.deleteWebhook(existingWebhookId);
      } catch (error) {
        logger.warn(
          { appId: appData._id, error },
          "Failed to delete PayPal webhook on sync disable",
        );
      }
    }
    data.webhookId = undefined;
  }

  public async processWebhook(
    appData: ConnectedAppData<PaypalConfiguration>,
    request: ApiRequest,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("processWebhook");
    logger.debug({ appId: appData._id }, "Processing PayPal webhook");

    const config = appData.data;
    const bodyText = await request.text();

    // TODO: Remove as it is a temp debug
    logger.warn(
      { appId: appData._id, bodyText },
      "Received PayPal webhook body",
    );

    const client = await this.getSimplifiedClient(appData);

    if (config?.webhookId) {
      try {
        if (this.environment === Environment.Sandbox) {
          logger.debug(
            { appId: appData._id },
            "Skipping webhook signature verification in sandbox",
          );
        } else {
          await client.verifyWebhook({
            body: {
              auth_algo: request.headers.get("paypal-auth-algo") || "",
              cert_url: request.headers.get("paypal-cert-url") || "",
              transmission_id:
                request.headers.get("paypal-transmission-id") || "",
              transmission_sig:
                request.headers.get("paypal-transmission-sig") || "",
              transmission_time:
                request.headers.get("paypal-transmission-time") || "",
              webhook_id: config.webhookId,
              webhook_event: bodyText,
            },
          });
        }
      } catch (error) {
        logger.warn(
          { appId: appData._id, error },
          "PayPal webhook signature verification failed",
        );
        return Response.json({ success: false }, { status: 400 });
      }
    } else {
      logger.warn(
        { appId: appData._id },
        "No webhook id configured; skipping webhook processing",
      );

      return Response.json({ success: false }, { status: 405 });
    }

    logger.debug({ appId: appData._id }, "Parsing PayPal webhook event");
    let event: any;
    try {
      event = JSON.parse(bodyText);
    } catch (error) {
      logger.warn(
        { appId: appData._id, error },
        "Invalid PayPal webhook event",
      );

      return Response.json({ success: false }, { status: 400 });
    }

    if (event?.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
      logger.debug(
        { appId: appData._id, eventType: event?.event_type },
        "Ignoring non-capture PayPal webhook event",
      );
      return Response.json({ success: true, ignored: true }, { status: 200 });
    }

    const resource = event.resource;
    const captureId: string | undefined = resource?.id;
    const orderId: string | undefined =
      resource?.supplementary_data?.related_ids?.order_id;

    if (!captureId) {
      logger.warn({ appId: appData._id }, "Capture event missing capture id");
      return Response.json({ success: true, ignored: true }, { status: 200 });
    }

    const amount = parseFloat(resource?.amount?.value) || 0;
    const currency: string | undefined = resource?.amount?.currency_code;
    let breakdown = resource?.seller_receivable_breakdown;
    if (!breakdown && orderId) {
      logger.debug(
        { appId: appData._id, orderId },
        "Webhook payload omitted the fee breakdown, fetching it from the order",
      );
      const { order } = await client.getOrder(orderId);
      breakdown =
        order?.purchase_units?.[0]?.payments?.captures?.[0]
          ?.seller_receivable_breakdown;
    }

    const transactionTime = resource?.create_time
      ? new Date(resource.create_time)
      : new Date();

    const result = await this.ingestInStoreCapture(
      appData,
      {
        captureId,
        orderId,
        amount,
        currency: currency ?? "",
        transactionTime,
        breakdown,
        raw: event,
      },
      client,
    );

    if (result === "skipped" || result === "already_exists") {
      return Response.json({ success: true, ignored: true }, { status: 200 });
    }

    return Response.json({ success: true }, { status: 200 });
  }

  public async processJob(
    appData: ConnectedAppData<PaypalConfiguration>,
    jobData: AppJobRequest<PaypalJobPayload>,
  ): Promise<void> {
    const logger = this.loggerFactory("processJob");

    if (jobData.type !== "app") {
      return;
    }

    if (jobData.payload?.type !== PAYPAL_TRANSACTION_SYNC_JOB_TYPE) {
      logger.debug({ jobData }, "Skipping unknown PayPal job type");
      return;
    }

    const config = appData.data;
    if (!config?.enableInStoreSync) {
      logger.debug(
        { appId: appData._id },
        "In-store sync disabled, skipping transaction poll",
      );
      return;
    }

    logger.debug(
      { appId: appData._id },
      "Processing PayPal transaction sync job",
    );

    try {
      const client = await this.getSimplifiedClient(appData);
      await runPaypalTransactionSync({
        appData,
        client,
        ingest: (capture) =>
          this.ingestInStoreCapture(appData, capture, client),
        logger: logger,
      });
    } catch (error) {
      logger.error(
        { appId: appData._id, error },
        "PayPal transaction sync job failed",
      );
    }
  }

  protected async ensureTransactionSyncRepeatableJob(
    appId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("ensureTransactionSyncRepeatableJob");

    try {
      const schedulerId = getPaypalTransactionSyncSchedulerId(appId);

      await this.props.services.jobService.scheduleRepeatableJob(
        {
          type: "app",
          appId,
          payload: {
            type: PAYPAL_TRANSACTION_SYNC_JOB_TYPE,
          } satisfies PaypalJobPayload,
        },
        {
          id: schedulerId,
          every: PAYPAL_TRANSACTION_SYNC_INTERVAL_SECONDS * 1000,
        },
      );

      logger.debug(
        { appId, schedulerId },
        "Ensured PayPal transaction sync job scheduler",
      );
    } catch (error) {
      logger.error(
        { appId, error },
        "Failed to ensure PayPal transaction sync repeatable job",
      );
    }
  }

  protected async removeTransactionSyncRepeatableJob(
    appId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("removeTransactionSyncRepeatableJob");

    try {
      const schedulerId = getPaypalTransactionSyncSchedulerId(appId);
      await this.props.services.jobService.removeRepeatableJob(schedulerId);
      logger.debug(
        { appId, schedulerId },
        "Removed PayPal transaction sync job scheduler",
      );
    } catch (error) {
      logger.warn(
        { appId, error },
        "Failed to remove PayPal transaction sync repeatable job",
      );
    }
  }

  /**
   * Normalizes an in-store PayPal capture and ingests it into synced payments.
   * Shared by webhooks and the periodic transaction poll.
   */
  protected async ingestInStoreCapture(
    appData: ConnectedAppData<PaypalConfiguration>,
    capture: InStoreCaptureInput,
    client?: PaypalClient,
  ): Promise<InStoreCaptureIngestResult> {
    const logger = this.loggerFactory("ingestInStoreCapture");
    const config = appData.data;

    const { paymentsService } = this.props.services;

    const existingPayment =
      (await paymentsService.getPaymentByExternalId(capture.captureId)) ??
      (capture.orderId
        ? await paymentsService.getPaymentByExternalId(capture.orderId)
        : null);
    if (existingPayment) {
      logger.debug(
        { appId: appData._id, captureId: capture.captureId },
        "Capture already recorded as a payment, skipping",
      );
      return "already_exists";
    }

    const onlineIntent =
      (await paymentsService.getIntentByExternalId(capture.captureId)) ??
      (capture.orderId
        ? await paymentsService.getIntentByExternalId(capture.orderId)
        : null);
    if (onlineIntent) {
      logger.debug(
        {
          appId: appData._id,
          captureId: capture.captureId,
          orderId: capture.orderId,
        },
        "Capture belongs to a tracked online checkout, skipping",
      );
      return "skipped";
    }

    const existingSynced = await this.props.services.syncedPaymentsService.list(
      {
        externalId: capture.captureId,
        limit: 0,
      },
    );
    if (existingSynced.total > 0) {
      logger.debug(
        { appId: appData._id, captureId: capture.captureId },
        "Capture already ingested as synced payment, skipping",
      );
      return "already_exists";
    }

    if (capture.amount <= 0) {
      logger.debug(
        { appId: appData._id, captureId: capture.captureId },
        "Capture has no positive amount, skipping",
      );
      return "skipped";
    }

    let currency = capture.currency;
    if (!currency) {
      const { currency: orgCurrency } =
        await this.props.services.configurationService.getConfiguration(
          "general",
        );
      currency = orgCurrency;
    }

    let fees = capture.fees ?? [];
    if (fees.length === 0 && capture.breakdown) {
      fees = this.extractFees(capture.breakdown);
    }

    if (
      fees.length === 0 &&
      capture.orderId &&
      client &&
      capture.breakdown === undefined
    ) {
      const { order } = await client.getOrder(capture.orderId);
      const breakdown =
        order?.purchase_units?.[0]?.payments?.captures?.[0]
          ?.seller_receivable_breakdown;
      fees = this.extractFees(breakdown);
    }

    const transaction: SyncedPaymentTransaction = {
      appId: appData._id,
      appName: PAYPAL_APP_NAME,
      externalId: capture.captureId,
      orderId: capture.orderId,
      amount: capture.amount,
      currency,
      transactionTime: capture.transactionTime,
      fees,
      providerSplit: capture.providerSplit,
      raw: capture.raw,
    };

    try {
      await this.props.services.syncedPaymentsService.ingest(
        transaction,
        systemEventSource,
        { matchWindowMinutes: config?.matchWindowMinutes },
      );
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          captureId: capture.captureId,
          error: error?.message || error,
        },
        "Failed to ingest synced PayPal payment",
      );
      throw error;
    }

    logger.info(
      {
        appId: appData._id,
        captureId: capture.captureId,
        amount: capture.amount,
      },
      "Successfully ingested PayPal in-store payment",
    );

    return "ingested";
  }

  /** Maps a PayPal seller receivable breakdown to internal payment fees. */
  protected extractFees(breakdown: any): PaymentFee[] {
    if (!breakdown) {
      return [];
    }

    const platformFees: PaymentFee[] = (breakdown.platform_fees || []).map(
      (fee: any) => ({
        type: "platform" as const,
        amount: parseFloat(fee?.amount?.value) || 0,
      }),
    );

    const paypalFee: PaymentFee[] = breakdown.paypal_fee
      ? [
          {
            type: "transaction",
            amount: parseFloat(breakdown.paypal_fee.value) || 0,
          },
        ]
      : [];

    return [...platformFees, ...paypalFee].filter((fee) => fee.amount > 0);
  }

  // protected getClient({
  //   data,
  //   token: dbToken,
  // }: Pick<ConnectedAppData, "data" | "token">): Client {
  //   const client = new Client({
  //     environment:
  //       process.env.PAYPAL_ENVIRONMENT?.toLocaleLowerCase() === "sandbox"
  //         ? Environment.Sandbox
  //         : Environment.Production,
  //     clientCredentialsAuthCredentials: {
  //       oAuthClientId: data.clientId,
  //       oAuthClientSecret: data.secretKey,

  //       oAuthOnTokenUpdate: (token: OAuthToken) => {
  //         // Add the callback handler to perform operations like save to DB or file etc.
  //         // It will be triggered whenever the token gets updated
  //         this.props.update({
  //           token,
  //         });
  //       },
  //       oAuthTokenProvider: (
  //         lastOAuthToken: OAuthToken | undefined,
  //         authManager: ClientCredentialsAuthManager
  //       ) => {
  //         // Add the callback handler to provide a new OAuth token
  //         // It will be triggered whenever the lastOAuthToken is undefined or expired
  //         return dbToken ?? authManager.fetchToken();
  //       },
  //     },
  //   });

  //   return client;
  // }

  public async getApplePayDomainAssociation(
    appData: ConnectedAppData,
  ): Promise<string | null> {
    const logger = this.loggerFactory("getApplePayDomainAssociation");
    logger.debug(
      { appId: appData._id },
      "Fetching Apple Pay domain association from PayPal",
    );

    return this.environment === Environment.Sandbox
      ? APPLE_PAY_DOMAIN_ASSOCIATION_SANDBOX
      : APPLE_PAY_DOMAIN_ASSOCIATION_PRODUCTION;
  }

  public getFormProps(
    appData: ConnectedAppData<PaypalConfiguration>,
  ): PaypalFormProps {
    if (!appData.data)
      throw new ConnectedAppError(
        "app_paypal_admin.statusText.app_not_configured" satisfies PaypalAdminAllKeys,
      );
    const { secretKey, clientId, ...rest } = appData.data;

    return {
      ...rest,
      clientId: decrypt(clientId),
      isSandbox: this.environment === Environment.Sandbox,
    };
  }

  protected async createOrder(
    appData: ConnectedAppData,
    request: CreateOrderRequest,
  ) {
    const logger = this.loggerFactory("createOrder");
    logger.debug(
      { appId: appData._id, paymentIntentId: request.paymentIntentId },
      "Creating PayPal order",
    );

    try {
      const intent = await this.props.services.paymentsService.getIntent(
        request.paymentIntentId,
      );

      if (!intent) {
        logger.error(
          { appId: appData._id, paymentIntentId: request.paymentIntentId },
          "Payment intent not found",
        );
        return Response.json({ error: "intent_not_found" }, { status: 400 });
      }

      logger.debug(
        {
          appId: appData._id,
          paymentIntentId: request.paymentIntentId,
          amount: intent.amount,
        },
        "Retrieved payment intent, creating PayPal order",
      );

      const client = await this.getSimplifiedClient(appData);
      // const ordersController = new OrdersController(client);
      // const { result: order, ...httpResponse } =
      //   await ordersController.createOrder({
      //     body: {
      //       intent: CheckoutPaymentIntent.Capture,
      //       purchaseUnits: [
      //         {
      //           amount: {
      //             currencyCode: "USD",
      //             value: formatAmountString(intent.amount),
      //           },
      //         },
      //       ],
      //     },
      //   });

      const { currency } =
        await this.props.services.configurationService.getConfiguration(
          "general",
        );

      const { order, error } = await client.createOrder({
        amount: intent.amount,
        currency: currency,
        intent: "CAPTURE",
      });

      if (error) {
        logger.error(
          {
            appId: appData._id,
            paymentIntentId: request.paymentIntentId,
            statusCode: error.statusCode,
          },
          "Failed to create PayPal order",
        );
        return Response.json(
          { error: "create_order_failed" },
          { status: error.statusCode || 500 },
        );
      }

      logger.debug(
        {
          appId: appData._id,
          paymentIntentId: request.paymentIntentId,
          orderId: order.id,
        },
        "Successfully created PayPal order, updating payment intent",
      );

      await this.props.services.paymentsService.updateIntent(intent._id, {
        data: {
          orderId: order.id,
        },
      });

      logger.info(
        {
          appId: appData._id,
          paymentIntentId: request.paymentIntentId,
          orderId: order.id,
        },
        "Successfully created PayPal order",
      );

      return Response.json(order);
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          paymentIntentId: request.paymentIntentId,
          error: error?.message || error?.toString(),
        },
        "Error creating PayPal order",
      );
      throw error;
    }
  }

  protected async captureOrder(
    appData: ConnectedAppData,
    request: CaptureOrderRequest,
  ) {
    const logger = this.loggerFactory("captureOrder");
    logger.debug(
      {
        appId: appData._id,
        orderId: request.orderId,
        paymentIntentId: request.paymentIntentId,
      },
      "Capturing PayPal order",
    );

    try {
      const intent = await this.props.services.paymentsService.getIntent(
        request.paymentIntentId,
      );

      if (!intent) {
        logger.error(
          { appId: appData._id, paymentIntentId: request.paymentIntentId },
          "Payment intent not found",
        );
        return Response.json({ error: "intent_not_found" }, { status: 400 });
      }

      if (intent.data?.orderId !== request.orderId) {
        logger.error(
          {
            appId: appData._id,
            orderId: request.orderId,
            intentOrderId: intent.data?.orderId,
            requestIntentId: request.paymentIntentId,
          },
          "Payment intent order ID mismatch",
        );
        return Response.json(
          { error: "intent_order_id_not_match" },
          { status: 400 },
        );
      }

      logger.debug(
        {
          appId: appData._id,
          paymentIntentId: request.paymentIntentId,
        },
        "Retrieved payment intent, capturing PayPal order",
      );

      const client = await this.getSimplifiedClient(appData);
      // const ordersController = new OrdersController(client);
      // const { result: order, ...httpResponse } =
      //   await ordersController.captureOrder({
      //     id: request.orderId,
      //   });

      const { order, error } = await client.captureOrder(request.orderId);

      if (error) {
        logger.error(
          {
            appId: appData._id,
            orderId: request.orderId,
            statusCode: error.statusCode,
          },
          "Failed to capture PayPal order",
        );

        await this.props.services.paymentsService.updateIntent(intent._id, {
          status: "failed",
        });

        return Response.json(
          { error: "capture_order_failed" },
          { status: error.statusCode || 500 },
        );
      }

      logger.debug(
        {
          appId: appData._id,
          orderId: request.orderId,
          paymentIntentId: request.paymentIntentId,
        },
        "Successfully captured PayPal order, updating payment intent status",
      );

      const captureId = order.purchase_units?.[0].payments?.captures?.[0].id;
      if (!captureId) {
        logger.error(
          { appId: appData._id, orderId: request.orderId },
          "Failed to get capture ID from PayPal order",
        );
        return Response.json(
          { error: "failed_to_get_capture_id" },
          { status: 400 },
        );
      }

      const platformFees: PaymentFee[] =
        order.purchase_units?.[0].payments?.captures?.[0]?.seller_receivable_breakdown?.platform_fees?.map(
          (fee) => ({
            type: "platform",
            amount: parseFloat(fee.amount.value) || 0,
          }),
        ) || [];

      const paypalFees: PaymentFee[] = order.purchase_units?.[0].payments
        ?.captures?.[0]?.seller_receivable_breakdown?.paypal_fee
        ? [
            {
              type: "transaction",
              amount:
                parseFloat(
                  order.purchase_units?.[0].payments?.captures?.[0]
                    ?.seller_receivable_breakdown?.paypal_fee.value,
                ) || 0,
            },
          ]
        : [];

      const fees = [...platformFees, ...paypalFees];

      await this.props.services.paymentsService.updateIntent(intent._id, {
        status: "paid",
        fees,
        externalId: captureId,
      });

      logger.info(
        {
          appId: appData._id,
          orderId: request.orderId,
          captureId,
          paymentIntentId: request.paymentIntentId,
        },
        "Successfully captured PayPal order",
      );

      return Response.json(order);
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          orderId: request.orderId,
          paymentIntentId: request.paymentIntentId,
          error: error?.message || error?.toString(),
        },
        "Error capturing PayPal order",
      );
      throw error;
    }
  }

  public async refundPayment(
    appData: ConnectedAppData,
    payment: Payment,
    amount: number,
  ): Promise<{ success: boolean; error?: string }> {
    const logger = this.loggerFactory("refundPayment");
    logger.debug(
      {
        appId: appData._id,
        paymentId: payment._id,
        paymentType: payment.type,
        paymentMethod: payment.method,
        amount,
        ...(payment.method === "online" && {
          appName: (payment as any).appName,
          externalId: (payment as any).externalId,
        }),
      },
      "Processing PayPal refund",
    );

    if (
      payment.method !== "online" ||
      (payment as any).appName !== PAYPAL_APP_NAME ||
      !payment.externalId
    ) {
      logger.debug(
        { appId: appData._id, paymentId: payment._id },
        "Payment not supported for refund",
      );
      return { success: false, error: "not_supported" };
    }

    const captureId = payment.externalId;

    try {
      logger.debug(
        { appId: appData._id, paymentId: payment._id, captureId },
        "Processing PayPal refund with capture ID",
      );

      const client = await this.getSimplifiedClient(appData);

      const { currency } =
        await this.props.services.configurationService.getConfiguration(
          "general",
        );

      // const clientRefund = this.getClient(appData);
      // const paymentsController = new PaymentsController(clientRefund);
      // const { result, ...refundHttpResponse } =
      //   await paymentsController.refundCapturedPayment({ captureId });

      const { ok: refundOk, error: refundError } = await client.refundPayment(
        captureId,
        amount,
        currency,
      );

      if (!refundOk || refundError) {
        logger.error(
          {
            appId: appData._id,
            paymentId: payment._id,
            captureId,
            statusCode: refundError.statusCode,
          },
          "Failed to refund PayPal payment",
        );
        return {
          success: false,
          error: JSON.stringify(refundError),
        };
      }

      logger.info(
        { appId: appData._id, paymentId: payment._id, captureId },
        "Successfully refunded PayPal payment",
      );

      return { success: true };
    } catch (error: any) {
      logger.error(
        {
          appId: appData._id,
          paymentId: payment._id,
          error: error?.message || error?.toString(),
        },
        "Error processing PayPal refund",
      );
      throw error;
    }
  }

  protected async getSimplifiedClient({
    data,
    token: dbToken,
  }: Pick<
    ConnectedAppData<PaypalConfiguration>,
    "data" | "token"
  >): Promise<PaypalClient> {
    const logger = this.loggerFactory("getSimplifiedClient");
    const environment = this.environment;

    const clientId = data?.clientId ? decrypt(data.clientId) : undefined;
    const secretKey = data?.secretKey ? decrypt(data.secretKey) : undefined;

    logger.debug(
      {
        clientId: clientId ? maskify(clientId) : undefined,
        environment,
      },
      "Creating simplified PayPal client",
    );

    if (!data || !clientId || !secretKey) {
      logger.error("No PayPal configuration data provided");
      throw new ConnectedAppError(
        "app_paypal_admin.statusText.no_data" satisfies PaypalAdminAllKeys,
      );
    }

    try {
      // const { url } = await this.props.services
      //   .ConfigurationService()
      //   .getConfiguration("general");

      logger.debug(
        { clientId: maskify(clientId) },
        "Created simplified PayPal client",
      );

      return new PaypalClient(
        clientId,
        secretKey,
        environment === Environment.Production,
      );
    } catch (error: any) {
      logger.error(
        {
          clientId: maskify(clientId),
          error: error?.message || error?.toString(),
        },
        "Error creating simplified PayPal client",
      );
      throw error;
    }
  }

  // protected getClient({
  //   data,
  //   token: dbToken,
  // }: Pick<ConnectedAppData<PaypalConfiguration>, "data" | "token">) {
  //   const logger = this.loggerFactory("getClient");

  //   const clientId = data?.clientId ? decrypt(data.clientId) : undefined;
  //   const secretKey = data?.secretKey ? decrypt(data.secretKey) : undefined;

  //   logger.debug(
  //     {
  //       clientId: clientId ? maskify(clientId) : undefined,
  //       environment: this.environment,
  //     },
  //     "Creating PayPal client"
  //   );

  //   if (!data || !clientId || !secretKey) {
  //     logger.error("No PayPal configuration data provided");
  //     throw new ConnectedAppError("paypal.statusText.no_data");
  //   }

  //   logger.debug(
  //     { clientId: maskify(clientId), environment: this.environment },
  //     "Created PayPal client"
  //   );

  //   return new Client({
  //     environment: this.environment,
  //     clientCredentialsAuthCredentials: {
  //       oAuthClientId: clientId,
  //       oAuthClientSecret: secretKey,
  //       oAuthOnTokenUpdate: async (token) => {
  //         logger.debug(
  //           { clientId: maskify(clientId) },
  //           "Updating PayPal OAuth token"
  //         );
  //         await this.props.update({
  //           token,
  //         });
  //       },
  //       oAuthTokenProvider: (lastOAuthToken, authManager) => {
  //         logger.debug(
  //           { clientId: maskify(clientId), hasExistingToken: !!dbToken },
  //           "Providing PayPal OAuth token"
  //         );
  //         const oAuthToken = dbToken;
  //         if (oAuthToken != null && !authManager.isExpired(oAuthToken)) {
  //           logger.debug(
  //             { clientId: maskify(clientId) },
  //             "Using existing PayPal OAuth token"
  //           );
  //           return oAuthToken;
  //         }

  //         logger.debug(
  //           { clientId: maskify(clientId) },
  //           "Fetching new PayPal OAuth token"
  //         );
  //         return authManager.fetchToken();
  //       },
  //     },
  //   });
  // }

  protected get environment() {
    return process.env.PAYPAL_ENV === "production"
      ? Environment.Production
      : process.env.NODE_ENV === "development" ||
          process.env.PAYPAL_ENVIRONMENT?.toLocaleLowerCase() === "sandbox"
        ? Environment.Sandbox
        : Environment.Production;
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    const db = await this.props.getDbConnection();
    const payment = await db.collection("payments").findOne({
      organizationId: appData.organizationId,
      appId: appData._id,
    });

    if (payment) {
      logger.warn(
        { appId: appData._id },
        "Cannot uninstall PayPal app: payments exist",
      );
      return {
        success: false,
        code: "cannot_uninstall_has_payments",
        error: {
          key: "app_paypal_admin.statusText.cannot_uninstall_has_payments" satisfies PaypalAdminAllKeys,
        },
      };
    }

    await this.removeTransactionSyncRepeatableJob(appData._id);

    const webhookId = (appData.data as PaypalConfiguration | undefined)
      ?.webhookId;
    if (webhookId) {
      try {
        const client = await this.getSimplifiedClient(appData);
        await client.deleteWebhook(webhookId);
        logger.info(
          { appId: appData._id, webhookId },
          "Deleted PayPal webhook on uninstall",
        );
      } catch (error) {
        logger.warn(
          { appId: appData._id, error },
          "Failed to delete PayPal webhook on uninstall",
        );
      }
    }

    return { success: true, code: "ok" };
  }
}

export default PaypalConnectedApp;
