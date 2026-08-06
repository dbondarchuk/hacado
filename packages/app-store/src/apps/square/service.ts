import { createHmac, timingSafeEqual } from "node:crypto";

import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  ApiResponse,
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppRequestError,
  ConnectedAppResponse,
  ConnectedAppStatusWithText,
  ConnectedAppUninstallResult,
  ConnectedOauthAppTokens,
  EventEnvelope,
  IConnectedAppProps,
  IConnectedAppWithWebhook,
  IEventSubscriber,
  IOAuthConnectedApp,
  IPaymentProcessor,
  ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE,
  OrganizationDomainChangedPayload,
  Payment,
  PaymentFee,
  SyncedPaymentTransaction,
  systemEventSource,
} from "@hacado/types";
import { decrypt, encrypt, getAdminUrl, getWebsiteDomain } from "@hacado/utils";
import { getApplePayDomainAssociation } from "./apple-pay";
import { getSquareOrder, getSquarePayment } from "./client";
import { SQUARE_APP_NAME } from "./const";
import {
  processingFeesFromSquarePayment as mapProcessingFeesFromSquarePayment,
  mapSquarePaymentToIngestInput,
  SquareInStorePaymentInput,
  SquarePaymentForSync,
} from "./map-payment";
import {
  SquareFormProps,
  SquareMerchantData,
  squareMerchantDataSchema,
  squarePayRequestSchema,
  SquareSyncSettingsRequest,
  squareSyncSettingsRequestSchema,
} from "./models";
import {
  SquareAdminAllKeys,
  SquareAdminKeys,
  SquareAdminNamespace,
} from "./translations/types";
import {
  isSquareSandbox,
  SQUARE_API_VERSION,
  squareApiBaseUrl,
  squareOAuthAuthorizeUrl,
  squareOAuthTokenUrl,
} from "./urls";

const CONNECTED_APPS_COLLECTION = "connected-apps";

/** Matches synced-payments ingest default match window. */
const DEFAULT_IN_STORE_MATCH_WINDOW_MINUTES = 120;

type InStorePaymentIngestResult = "ingested" | "skipped" | "already_exists";

/** Square `Payment.processing_fee` entries use `amount_money` (minor units). */
type SquarePaymentProcessingFees = {
  processing_fee?: Array<{
    amount_money?: { amount?: bigint | number | string };
    type?: string;
  }>;
};

type SquareWebhookSubscription = {
  id?: string;
  name?: string;
  enabled?: boolean;
  event_types?: string[];
  notification_url?: string;
  signature_key?: string;
};

function verifySquareWebhookSignature(
  signatureKey: string,
  notificationUrl: string,
  requestBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) {
    return false;
  }
  const hmac = createHmac("sha256", signatureKey);
  hmac.update(notificationUrl + requestBody);
  const digest = hmac.digest("base64");
  try {
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function parsePaymentUpdatedWebhook(body: unknown): {
  merchantId?: string;
  payment?: SquarePaymentForSync;
} | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const root = body as Record<string, unknown>;
  if (root.type !== "payment.updated") {
    return null;
  }
  const merchantId =
    typeof root.merchant_id === "string" ? root.merchant_id : undefined;
  const data = root.data;
  if (!data || typeof data !== "object") {
    return null;
  }
  const d = data as Record<string, unknown>;
  const obj = d.object;
  if (!obj || typeof obj !== "object") {
    return null;
  }
  const o = obj as Record<string, unknown>;
  const payment = o.payment;
  if (!payment || typeof payment !== "object") {
    return null;
  }
  return {
    merchantId,
    payment: payment as SquarePaymentForSync,
  };
}

class SquareConnectedApp
  implements
    IOAuthConnectedApp<SquareMerchantData>,
    IPaymentProcessor,
    IConnectedAppWithWebhook<SquareMerchantData>,
    IEventSubscriber
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "SquareConnectedApp",
      props.organizationId,
    );
  }

  public async getLoginUrl(appId: string): Promise<string> {
    const logger = this.loggerFactory("getLoginUrl");
    const clientId = process.env.SQUARE_APP_APPLICATION_ID;
    if (!clientId) {
      logger.error("Missing SQUARE_APP_APPLICATION_ID");
      throw new ConnectedAppError(
        "app_square_admin.statusText.missing_oauth_config" satisfies SquareAdminAllKeys,
      );
    }

    // Square allows space or "+" between scopes; `URLSearchParams` encodes literal "+" as "%2B",
    // which Square rejects-use spaces so delimiters become "%20" (or "+" per UA rules for space).
    const scope = [
      "MERCHANT_PROFILE_READ",
      "PAYMENTS_READ",
      "PAYMENTS_WRITE",
    ].join(" ");
    const authUrl = new URL(squareOAuthAuthorizeUrl());
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", appId);
    if (!isSquareSandbox()) {
      authUrl.searchParams.set("session", "false");
    }

    logger.debug({ appId }, "Built Square OAuth authorize URL");
    return authUrl.toString();
  }

  public async processRedirect(
    request: ApiRequest,
  ): Promise<ConnectedAppResponse> {
    const logger = this.loggerFactory("processRedirect");

    try {
      const url = new URL(request.url);
      const appId = url.searchParams.get("state") as string;
      const denied = url.searchParams.get("error");

      if (denied === "access_denied") {
        return {
          appId,
          error:
            "app_square_admin.statusText.access_denied" satisfies SquareAdminAllKeys,
        };
      }

      const code = url.searchParams.get("code") as string;

      if (!appId) {
        throw new ConnectedAppError(
          "app_square_admin.statusText.redirect_missing_app_id" satisfies SquareAdminAllKeys,
        );
      }

      if (!code) {
        throw new ConnectedAppError(
          "app_square_admin.statusText.redirect_missing_code" satisfies SquareAdminAllKeys,
        );
      }

      const clientId = process.env.SQUARE_APP_APPLICATION_ID;
      const clientSecret = process.env.SQUARE_APP_APPLICATION_SECRET;
      if (!clientId || !clientSecret) {
        throw new ConnectedAppError(
          "app_square_admin.statusText.missing_oauth_config" satisfies SquareAdminAllKeys,
        );
      }

      const tokenRes = await fetch(squareOAuthTokenUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Square-Version": SQUARE_API_VERSION,
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
        }),
      });

      const tokenJson = (await tokenRes.json()) as Record<string, unknown>;

      if (!tokenRes.ok || tokenJson.errors) {
        logger.error(
          { status: tokenRes.status, tokenJson },
          "Square ObtainToken failed",
        );
        throw new ConnectedAppError(
          "app_square_admin.statusText.oauth_error" satisfies SquareAdminAllKeys,
        );
      }

      const accessToken = tokenJson.access_token as string | undefined;
      const refreshToken = tokenJson.refresh_token as string | undefined;
      const expiresAtRaw = tokenJson.expires_at as string | undefined;
      const merchantId = tokenJson.merchant_id as string | undefined;

      if (!accessToken || !refreshToken || !expiresAtRaw || !merchantId) {
        logger.error(
          {
            hasAccess: !!accessToken,
            hasRefresh: !!refreshToken,
            hasExpiry: !!expiresAtRaw,
            hasMerchant: !!merchantId,
          },
          "Square ObtainToken response incomplete",
        );
        throw new ConnectedAppError(
          "app_square_admin.statusText.not_authorized" satisfies SquareAdminAllKeys,
        );
      }

      const expiresOn = new Date(expiresAtRaw);

      const locationId = await this.fetchPrimaryLocationId(accessToken);
      if (!locationId) {
        throw new ConnectedAppError(
          "app_square_admin.statusText.no_locations" satisfies SquareAdminAllKeys,
        );
      }

      const db = await this.props.getDbConnection();
      const existing = await db
        .collection<
          ConnectedAppData<SquareMerchantData>
        >(CONNECTED_APPS_COLLECTION)
        .findOne({ _id: appId });

      const data: SquareMerchantData = {
        locationId,
        merchantId,
        ...(existing?.data?.enableInStoreSync !== undefined
          ? { enableInStoreSync: existing.data.enableInStoreSync }
          : {}),
        ...(existing?.data?.matchWindowMinutes !== undefined
          ? { matchWindowMinutes: existing.data.matchWindowMinutes }
          : {}),
      };

      const parsed = squareMerchantDataSchema.safeParse(data);
      if (!parsed.success) {
        throw new ConnectedAppError(
          "app_square_admin.statusText.no_locations" satisfies SquareAdminAllKeys,
        );
      }

      return {
        appId,
        token: {
          accessToken: encrypt(accessToken),
          refreshToken: encrypt(refreshToken),
          expiresOn,
        },
        data: parsed.data,
        account: {
          username: merchantId,
        },
      };
    } catch (e: unknown) {
      logger.error(
        { url: request.url, error: e instanceof Error ? e.message : String(e) },
        "Square OAuth redirect failed",
      );

      const appId = new URL(request.url).searchParams.get("state") as string;

      return {
        appId,
        error:
          e instanceof ConnectedAppError
            ? e.key
            : ("app_square_admin.statusText.oauth_error" satisfies SquareAdminAllKeys),
        errorArgs: e instanceof ConnectedAppError ? e.args : undefined,
      };
    }
  }

  public async afterOAuthConnected(
    appData: ConnectedAppData<SquareMerchantData>,
  ): Promise<void> {
    const logger = this.loggerFactory("afterOAuthConnected");
    logger.debug({ appId: appData._id }, "Square after OAuth connected");

    await this.ensureDefaultInStoreSyncSettings(appData);

    await this.registerApplePayDomain(appData);
    logger.debug(
      { appId: appData._id },
      "Square Apple Pay domain registered successfully",
    );
  }

  protected async ensureDefaultInStoreSyncSettings(
    appData: ConnectedAppData<SquareMerchantData>,
  ): Promise<void> {
    const data = appData.data;
    if (!data) {
      return;
    }

    const patch: Partial<SquareMerchantData> = {};
    if (data.enableInStoreSync === undefined) {
      patch.enableInStoreSync = true;
    }
    if (data.matchWindowMinutes === undefined) {
      patch.matchWindowMinutes = DEFAULT_IN_STORE_MATCH_WINDOW_MINUTES;
    }
    if (Object.keys(patch).length === 0) {
      return;
    }

    await this.props.update({ data: { ...data, ...patch } });
  }

  public async onEvent(
    appData: ConnectedAppData<SquareMerchantData>,
    envelope: EventEnvelope,
  ): Promise<void> {
    if (envelope.type !== ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE) {
      return;
    }

    const logger = this.loggerFactory("onEvent");
    const payload = envelope.payload as OrganizationDomainChangedPayload;
    logger.debug(
      {
        appId: appData._id,
        previousDomain: payload.previousDomain,
        newDomain: payload.newDomain,
      },
      "Organization domain changed, re-registering Square Apple Pay domain",
    );

    await this.registerApplePayDomain(appData);
  }

  public getFormProps(
    appData: ConnectedAppData<SquareMerchantData>,
  ): SquareFormProps {
    const applicationId = process.env.SQUARE_APP_APPLICATION_ID;
    if (!applicationId) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.missing_oauth_config" satisfies SquareAdminAllKeys,
      );
    }
    if (!appData.data?.locationId) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.app_not_configured" satisfies SquareAdminAllKeys,
      );
    }

    return {
      applicationId,
      locationId: appData.data.locationId,
      isSandbox: isSquareSandbox(),
    };
  }

  public async getApplePayDomainAssociation(
    appData: ConnectedAppData<SquareMerchantData>,
  ): Promise<string | null> {
    return getApplePayDomainAssociation(isSquareSandbox());
  }

  public async processRequest(
    appData: ConnectedAppData<SquareMerchantData>,
    request: SquareSyncSettingsRequest,
  ): Promise<
    ConnectedAppStatusWithText<SquareAdminNamespace, SquareAdminKeys>
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id },
      "Processing Square sync settings request",
    );

    if (!appData.data?.merchantId || !appData.data?.locationId) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.app_not_configured" satisfies SquareAdminAllKeys,
      );
    }

    const { data, success, error } =
      squareSyncSettingsRequestSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid Square sync settings request");
      throw new ConnectedAppRequestError(
        "invalid_square_sync_settings_request",
        { error },
        400,
        error.message,
      );
    }

    const merged: SquareMerchantData = {
      ...appData.data,
      enableInStoreSync: data.enableInStoreSync,
      matchWindowMinutes: data.matchWindowMinutes,
    };

    const parsed = squareMerchantDataSchema.safeParse(merged);
    if (!parsed.success) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.app_not_configured" satisfies SquareAdminAllKeys,
      );
    }

    await this.props.update({ data: parsed.data });

    return {
      status: "connected",
      statusText:
        "app_square_admin.statusText.sync_settings_saved" satisfies SquareAdminAllKeys,
    };
  }

  public async processStaticWebhook(
    request: ApiRequest,
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("processStaticWebhook");

    logger.debug(
      {
        url: request.url,
        method: request.method,
      },
      "Processing Square webhook",
    );

    if (request.method.toUpperCase() !== "POST") {
      logger.debug(
        {
          method: request.method,
        },
        "Square webhook method not supported",
      );

      return new Response(null, { status: 405 });
    }

    const rawBody = await request.text();

    const signatureKey = process.env.SQUARE_APP_WEBHOOK_SIGNATURE_KEY;
    if (!signatureKey) {
      logger.warn("Missing webhook signature key on app");
      return Response.json(
        { error: "webhook_not_configured" },
        { status: 503 },
      );
    }

    const notificationUrl = `${getAdminUrl()}/apps/webhook/square`;

    const sig =
      request.headers.get("x-square-hmacsha256-signature") ??
      request.headers.get("X-Square-Hmacsha256-Signature");

    if (
      !verifySquareWebhookSignature(signatureKey, notificationUrl, rawBody, sig)
    ) {
      logger.warn(
        { notificationUrl },
        "Square webhook signature verification failed",
      );
      return Response.json({ error: "invalid_signature" }, { status: 403 });
    }

    logger.debug("Square webhook signature verification successful");

    let parsedJson: unknown;
    try {
      parsedJson = rawBody.length ? JSON.parse(rawBody) : null;
    } catch {
      logger.warn("Square webhook body is not JSON");
      return Response.json({ error: "invalid_body" }, { status: 400 });
    }

    const paymentEvent = parsePaymentUpdatedWebhook(parsedJson);
    if (!paymentEvent) {
      logger.warn("Square webhook payment event is not valid");

      return Response.json({ ok: true });
    }

    if (!paymentEvent.merchantId) {
      logger.warn("Square webhook merchant_id is missing");
      return Response.json({ error: "merchant_id_missing" }, { status: 403 });
    }

    logger.debug(
      {
        paymentEvent,
      },
      "Square webhook payment event",
    );

    const squarePaymentId = paymentEvent.payment?.id;
    const squareOrderId = paymentEvent.payment?.order_id;
    if (!squarePaymentId || !paymentEvent.payment) {
      logger.warn("Square webhook payment event is not valid");
      return Response.json({ ok: true });
    }

    const fees = this.processingFeesFromSquarePayment(paymentEvent.payment);

    if (fees.length && squareOrderId) {
      logger.debug({ fees }, "Square webhook fees");

      await this.applyFeeUpdatesFromWebhook(
        squarePaymentId,
        squareOrderId,
        fees,
        getOrganizationServiceContainer,
      );

      logger.debug(
        { squarePaymentId },
        "Square webhook fees applied successfully",
      );
    }

    if (
      paymentEvent.payment.status === "COMPLETED" &&
      paymentEvent.merchantId
    ) {
      await this.tryIngestInStorePaymentFromWebhook(
        paymentEvent.merchantId,
        squarePaymentId,
        paymentEvent.payment,
        getOrganizationServiceContainer,
      );
    }

    return Response.json({ ok: true });
  }

  public async processAppCall(
    appData: ConnectedAppData<SquareMerchantData>,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse | undefined> {
    const logger = this.loggerFactory("processAppCall");

    if (
      slug.length === 1 &&
      slug[0] === "pay" &&
      request.method.toUpperCase() === "POST"
    ) {
      try {
        logger.debug(
          {
            appId: appData._id,
            slug,
            method: request.method,
          },
          "Square pay handler",
        );

        const body = await request.json();
        const parsed = squarePayRequestSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { success: false, error: parsed.error.message },
            {
              status: 400,
            },
          );
        }

        return await this.createPaymentFromSource(
          appData,
          parsed.data.paymentIntentId,
          parsed.data.sourceId,
        );
      } catch (error: unknown) {
        logger.error(
          {
            appId: appData._id,
            error: error instanceof Error ? error.message : error,
          },
          "Square pay handler error",
        );
        throw error;
      }
    }

    return undefined;
  }

  protected async createPaymentFromSource(
    appData: ConnectedAppData<SquareMerchantData>,
    paymentIntentId: string,
    sourceId: string,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("createPaymentFromSource");

    const intent =
      await this.props.services.paymentsService.getIntent(paymentIntentId);
    if (!intent) {
      return Response.json({ error: "intent_not_found" }, { status: 400 });
    }

    if (!appData.data?.locationId) {
      return Response.json({ error: "square_not_configured" }, { status: 400 });
    }

    const accessToken = await this.getMerchantAccessToken(appData);

    const { currency } =
      await this.props.services.configurationService.getConfiguration(
        "general",
      );

    const amountCents = Math.round(intent.amount * 100);

    const idempotencyKey = crypto.randomUUID();

    logger.debug(
      {
        appId: appData._id,
        paymentIntentId,
        sourceId,
      },
      "Square create payment from source",
    );

    const paymentRes = await fetch(`${squareApiBaseUrl()}/v2/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": SQUARE_API_VERSION,
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        source_id: sourceId,
        amount_money: {
          amount: amountCents,
          currency,
        },
        location_id: appData.data.locationId,
        reference_id: intent._id,
        metadata: {
          organizationId: appData.organizationId,
          appId: appData._id,
        },
      }),
    });

    const paymentJson = (await paymentRes.json()) as {
      payment?: SquarePaymentProcessingFees & {
        id?: string;
        status?: string;
      };
      errors?: { detail?: string; code?: string }[];
    };

    if (!paymentRes.ok || paymentJson.errors?.length) {
      logger.error(
        {
          appId: appData._id,
          status: paymentRes.status,
          errors: paymentJson.errors,
        },
        "Square CreatePayment failed",
      );

      await this.props.services.paymentsService.updateIntent(intent._id, {
        status: "failed",
      });

      return Response.json(
        {
          success: false,
          error: paymentJson.errors?.[0]?.detail ?? "create_payment_failed",
        },
        { status: paymentRes.status || 400 },
      );
    }

    const payment = paymentJson.payment;
    const status = payment?.status;
    const ok = status === "COMPLETED" || status === "APPROVED";
    logger.debug(
      {
        appId: appData._id,
        paymentIntentId,
        sourceId,
        status,
        ok,
      },
      "Square create payment from source completed",
    );

    if (!payment?.id || !ok) {
      logger.error({ payment }, "Square payment not in a success state");
      await this.props.services.paymentsService.updateIntent(intent._id, {
        status: "failed",
      });
      return Response.json(
        {
          success: false,
          error: "payment_incomplete",
        },
        { status: 400 },
      );
    }

    // Prefer GET /v2/payments/{id} (with short retries); fall back to CreatePayment body; webhook can still refine later.
    const feesFromCreate = payment
      ? this.processingFeesFromSquarePayment(payment)
      : [];

    logger.debug(
      {
        appId: appData._id,
        paymentId: payment?.id,
      },
      "Square checking fees from create",
    );

    const feesFromGet = await this.fetchProcessingFeesForPayment(
      accessToken,
      payment.id,
      appData._id,
    );

    const fees =
      feesFromGet.length > 0
        ? feesFromGet
        : feesFromCreate.length > 0
          ? feesFromCreate
          : undefined;

    logger.debug(
      {
        appId: appData._id,
        paymentId: payment?.id,
        fees,
      },
      "Square fees",
    );

    await this.props.services.paymentsService.updateIntent(intent._id, {
      status: "paid",
      externalId: payment.id,
      fees,
    });

    logger.debug(
      {
        appId: appData._id,
        paymentId: payment?.id,
      },
      "Square payment updated intent successfully",
    );

    return Response.json({ success: true, payment });
  }

  public async refundPayment(
    appData: ConnectedAppData<SquareMerchantData>,
    payment: Payment,
    amount: number,
  ): Promise<{ success: boolean; error?: string }> {
    const logger = this.loggerFactory("refundPayment");

    if (
      payment.method !== "online" ||
      (payment as { appName?: string }).appName !== SQUARE_APP_NAME ||
      !(payment as { externalId?: string }).externalId
    ) {
      logger.debug(
        {
          appId: appData._id,
          paymentId: payment._id,
          appName: (payment as { appName?: string }).appName,
        },
        "Square refund payment not supported",
      );

      return { success: false, error: "not_supported" };
    }

    const externalId = (payment as { externalId: string }).externalId;

    logger.debug(
      {
        appId: appData._id,
        externalId,
      },
      "Square refund payment external ID",
    );

    try {
      const accessToken = await this.getMerchantAccessToken(appData);
      const { currency } =
        await this.props.services.configurationService.getConfiguration(
          "general",
        );

      const amountCents = Math.round(amount * 100);
      const idempotencyKey = `refund-${payment._id}-${amountCents}`.slice(
        0,
        45,
      );

      logger.debug(
        {
          appId: appData._id,
          externalId,
          amountCents,
          idempotencyKey,
        },
        "Square refund payment",
      );

      const res = await fetch(`${squareApiBaseUrl()}/v2/refunds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Square-Version": SQUARE_API_VERSION,
        },
        body: JSON.stringify({
          idempotency_key: idempotencyKey,
          payment_id: externalId,
          amount_money: {
            amount: amountCents,
            currency,
          },
          reason: "REQUESTED_BY_CUSTOMER",
        }),
      });

      const json = (await res.json()) as {
        refund?: { status?: string };
        errors?: { detail?: string }[];
      };

      if (!res.ok || json.errors?.length) {
        logger.error(
          { paymentId: payment._id, status: res.status, json },
          "Square refund failed",
        );
        return {
          success: false,
          error: json.errors?.[0]?.detail ?? "refund_failed",
        };
      }

      logger.debug(
        {
          appId: appData._id,
          externalId,
        },
        "Square refund payment completed successfully",
      );

      return { success: true };
    } catch (e: unknown) {
      logger.error(
        {
          paymentId: payment._id,
          error: e instanceof Error ? e.message : String(e),
        },
        "Square refund error",
      );
      return { success: false, error: "refund_error" };
    }
  }

  protected getSquareApplicationAccessToken(): string | null {
    const t = process.env.SQUARE_APP_ACCESS_TOKEN?.trim();
    return t && t.length > 0 ? t : null;
  }

  protected async applyFeeUpdatesFromWebhook(
    squarePaymentId: string,
    squareOrderId: string,
    fees: PaymentFee[],
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
  ): Promise<void> {
    const logger = this.loggerFactory("applyFeeUpdatesFromWebhook");

    logger.debug(
      {
        squarePaymentId,
        fees,
      },
      "Square webhook fees",
    );

    // TODO: figure out how to get the organization id from the webhook
    const db = await this.props.getDbConnection();
    const payments = db.collection<Payment>("payments");
    const payment = await payments.findOne({ externalId: squarePaymentId });

    if (!payment) {
      logger.warn("Square webhook payment not found");
      return;
    }

    if (payment.fees?.length === fees.length) {
      const a = JSON.stringify(payment.fees);
      const b = JSON.stringify(fees);
      if (a === b) {
        logger.debug(
          {
            squarePaymentId,
            fees,
          },
          "Square webhook fees are the same, skipping update",
        );
        return;
      }
    }

    logger.debug(
      {
        squarePaymentId,
        organizationId: payment.organizationId,
        fees,
      },
      "Square webhook fees are different, updating payment",
    );

    const paymentService = getOrganizationServiceContainer(
      payment.organizationId,
    ).services.paymentsService;

    await paymentService.updatePayment(
      payment._id,
      { fees },
      { actor: "system" },
    );

    logger.debug(
      {
        organizationId: payment.organizationId,
        squarePaymentId,
        fees,
      },
      "Square webhook fees updated successfully",
    );
  }

  protected async fetchOrderFromSquare(
    accessToken: string,
    orderId: string,
  ): Promise<{ metadata?: Record<string, string> } | null> {
    const logger = this.loggerFactory("fetchOrderFromSquare");
    const res = await fetch(`${squareApiBaseUrl()}/v2/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": SQUARE_API_VERSION,
      },
    });

    if (!res.ok) {
      logger.error("Square fetch order failed");
      throw new Error("Square fetch order failed");
    }

    const json = (await res.json()) as {
      order?: { metadata?: Record<string, string> };
      errors?: { detail?: string; code?: string }[];
    };

    if (!json.order) {
      logger.error("Square fetch order failed");
      throw new Error("Square fetch order failed");
    }

    return json.order;
  }

  protected async registerApplePayDomain(
    appData: ConnectedAppData<SquareMerchantData>,
  ) {
    const logger = this.loggerFactory("registerApplePayDomain");
    logger.debug({ appId: appData._id }, "Registering Square Apple Pay domain");

    const organization =
      await this.props.services.organizationService.getOrganization();
    if (!organization) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.apple_pay_domain_registration_failed" satisfies SquareAdminAllKeys,
      );
    }

    const domain = getWebsiteDomain(organization);
    logger.debug({ domain }, "Registering Square Apple Pay domain");

    const accessToken = await this.getMerchantAccessToken(appData);
    const res = await fetch(`${squareApiBaseUrl()}/v2/apple-pay/domains`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain_name: domain,
      }),
    });

    if (!res.ok) {
      const responseBody = await res.text();
      logger.error(
        {
          appId: appData._id,
          responseBody,
          status: res.status,
        },
        "Square register Apple Pay domain failed",
      );

      throw new Error("Square register Apple Pay domain failed");
    }

    const json = (await res.json()) as {
      status?: "PENDING" | "VERIFIED";
      errors?: { detail?: string; code?: string }[];
    };

    if (!json.status) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.apple_pay_domain_registration_failed" satisfies SquareAdminAllKeys,
      );
    }

    logger.debug(
      { appId: appData._id, status: json.status },
      "Square Apple Pay domain registered successfully",
    );
  }

  /**
   * Retrieves `processing_fee` from GET /v2/payments/{id} (often absent on create response).
   * Retries when the call succeeds but `processing_fee` is still empty (Square eventual consistency).
   */
  protected async fetchProcessingFeesForPayment(
    accessToken: string,
    paymentId: string,
    appId: string,
  ): Promise<PaymentFee[]> {
    const logger = this.loggerFactory("fetchProcessingFeesForPayment");
    const maxAttempts = 4;
    const delayMs = 500;

    logger.debug(
      {
        appId: appId,
        paymentId,
      },
      "Fetching Square processing fees for payment",
    );

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      logger.debug(
        {
          appId: appId,
          paymentId,
          attempt,
        },
        "Square processing fees fetch attempt",
      );

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
        payment?: SquarePaymentProcessingFees;
        errors?: { detail?: string; code?: string }[];
      };

      if (!res.ok || json.errors?.length || !json.payment) {
        logger.warn(
          {
            appId,
            paymentId,
            status: res.status,
            errors: json.errors,
            attempt,
          },
          "Square GetPayment failed or missing body; continuing without fee breakdown from GET",
        );
        return [];
      }

      logger.debug(
        {
          appId: appId,
          paymentId,
          attempt,
        },
        "Square GetPayment succeeded",
      );

      const fees = this.processingFeesFromSquarePayment(json.payment);
      if (fees.length > 0) {
        if (attempt > 0) {
          logger.debug(
            { appId, paymentId, attempt },
            "Square processing_fee populated after retry",
          );
        }

        logger.debug(
          {
            appId: appId,
            paymentId,
            attempt,
            fees,
          },
          "Square processing fees",
        );

        return fees;
      }

      logger.debug(
        { appId, paymentId, attempt },
        "Square GetPayment succeeded but processing_fee empty; will retry if attempts remain",
      );
    }

    logger.debug(
      { appId, paymentId, attempts: maxAttempts },
      "Square processing_fee still empty after retries",
    );
    return [];
  }

  protected processingFeesFromSquarePayment(
    payment: SquarePaymentProcessingFees,
  ): PaymentFee[] {
    return mapProcessingFeesFromSquarePayment(payment as SquarePaymentForSync);
  }

  protected async findConnectedAppsByMerchantId(
    merchantId: string,
  ): Promise<ConnectedAppData<SquareMerchantData>[]> {
    const db = await this.props.getDbConnection();
    return db
      .collection<ConnectedAppData<SquareMerchantData>>(
        CONNECTED_APPS_COLLECTION,
      )
      .find({
        name: SQUARE_APP_NAME,
        status: "connected",
        "data.merchantId": merchantId,
      })
      .toArray();
  }

  protected async tryIngestInStorePaymentFromWebhook(
    merchantId: string,
    squarePaymentId: string,
    webhookPayment: SquarePaymentForSync,
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
  ): Promise<void> {
    const logger = this.loggerFactory("tryIngestInStorePaymentFromWebhook");

    const appDocs = await this.findConnectedAppsByMerchantId(merchantId);
    const enabledApps = appDocs.filter((app) => app.data?.enableInStoreSync);

    if (!enabledApps.length) {
      logger.debug(
        { merchantId, squarePaymentId, connectedAppCount: appDocs.length },
        "No connected Square apps with in-store sync enabled for merchant",
      );
      return;
    }

    let payment = webhookPayment;
    let order = null;

    const enrichApp = enabledApps[0]!;
    const enrichProps = getOrganizationServiceContainer(
      enrichApp.organizationId,
    );
    const enrichInstance = new SquareConnectedApp(enrichProps);

    try {
      const accessToken =
        await enrichInstance.getMerchantAccessToken(enrichApp);
      const fetched = await getSquarePayment(accessToken, squarePaymentId);
      if (fetched) {
        payment = fetched;
      }
    } catch (error) {
      logger.warn(
        { appId: enrichApp._id, squarePaymentId, error },
        "Could not refresh Square payment from API; using webhook payload",
      );
    }

    if (payment.order_id) {
      try {
        const accessToken =
          await enrichInstance.getMerchantAccessToken(enrichApp);
        order = await getSquareOrder(accessToken, payment.order_id);
      } catch (error) {
        logger.warn(
          { appId: enrichApp._id, orderId: payment.order_id, error },
          "Could not fetch Square order for in-store ingest",
        );
      }
    }

    const input = mapSquarePaymentToIngestInput(payment, order);
    if (!input) {
      logger.debug(
        { merchantId, squarePaymentId },
        "Square payment not eligible for in-store ingest",
      );
      return;
    }

    for (const appDoc of enabledApps) {
      const orgProps = getOrganizationServiceContainer(appDoc.organizationId);
      const appInstance = new SquareConnectedApp(orgProps);
      try {
        await appInstance.ingestInStorePayment(appDoc, input);
      } catch (error) {
        logger.error(
          {
            appId: appDoc._id,
            organizationId: appDoc.organizationId,
            squarePaymentId,
            error,
          },
          "Failed to ingest Square in-store payment for connected app",
        );
      }
    }
  }

  /**
   * Normalizes an in-store Square payment and ingests it into synced payments.
   */
  protected async ingestInStorePayment(
    appData: ConnectedAppData<SquareMerchantData>,
    input: SquareInStorePaymentInput,
  ): Promise<InStorePaymentIngestResult> {
    const logger = this.loggerFactory("ingestInStorePayment");
    const config = appData.data;
    const { paymentsService, syncedPaymentsService } = this.props.services;

    const existingPayment =
      (await paymentsService.getPaymentByExternalId(input.paymentId)) ??
      (input.orderId
        ? await paymentsService.getPaymentByExternalId(input.orderId)
        : null);
    if (existingPayment) {
      logger.debug(
        { appId: appData._id, paymentId: input.paymentId },
        "Payment already recorded, skipping in-store ingest",
      );
      return "already_exists";
    }

    const onlineIntent =
      (await paymentsService.getIntentByExternalId(input.paymentId)) ??
      (input.orderId
        ? await paymentsService.getIntentByExternalId(input.orderId)
        : null);
    if (onlineIntent) {
      logger.debug(
        {
          appId: appData._id,
          paymentId: input.paymentId,
          orderId: input.orderId,
        },
        "Payment belongs to tracked online checkout, skipping in-store ingest",
      );
      return "skipped";
    }

    const existingSynced = await syncedPaymentsService.list({
      externalId: input.paymentId,
      limit: 0,
    });

    if (existingSynced.total > 0) {
      logger.debug(
        { appId: appData._id, paymentId: input.paymentId },
        "Payment already ingested as synced payment, skipping",
      );
      return "already_exists";
    }

    if (input.amount <= 0) {
      return "skipped";
    }

    let currency = input.currency;
    if (!currency) {
      const { currency: orgCurrency } =
        await this.props.services.configurationService.getConfiguration(
          "general",
        );
      currency = orgCurrency;
    }

    const transaction: SyncedPaymentTransaction = {
      appId: appData._id,
      appName: SQUARE_APP_NAME,
      externalId: input.paymentId,
      orderId: input.orderId,
      amount: input.amount,
      currency,
      transactionTime: input.transactionTime,
      fees: input.fees,
      providerSplit: input.providerSplit,
      raw: input.raw,
    };

    try {
      await syncedPaymentsService.ingest(transaction, systemEventSource, {
        matchWindowMinutes: config?.matchWindowMinutes,
      });
    } catch (error: unknown) {
      logger.error(
        {
          appId: appData._id,
          paymentId: input.paymentId,
          error: error instanceof Error ? error.message : error,
        },
        "Failed to ingest synced Square payment",
      );
      throw error;
    }

    logger.info(
      {
        appId: appData._id,
        paymentId: input.paymentId,
        amount: input.amount,
      },
      "Successfully ingested Square in-store payment",
    );

    return "ingested";
  }

  protected async fetchPrimaryLocationId(
    accessToken: string,
  ): Promise<string | null> {
    const logger = this.loggerFactory("fetchPrimaryLocationId");
    logger.debug("Fetching Square primary location ID");

    const res = await fetch(`${squareApiBaseUrl()}/v2/locations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": SQUARE_API_VERSION,
      },
    });

    const json = (await res.json()) as {
      locations?: { id?: string; status?: string }[];
      errors?: unknown[];
    };

    if (!res.ok || !json.locations?.length) {
      logger.warn("Square FetchPrimaryLocationId failed");

      return null;
    }

    const active =
      json.locations.find((l) => l.status === "ACTIVE") ?? json.locations[0];

    logger.debug(
      {
        locationId: active?.id,
      },
      "Square primary location ID found",
    );

    return active?.id ?? null;
  }

  protected async getMerchantAccessToken(
    appData: ConnectedAppData<SquareMerchantData>,
  ): Promise<string> {
    const logger = this.loggerFactory("getMerchantAccessToken");
    const token = appData.token as ConnectedOauthAppTokens | undefined;

    logger.debug(
      {
        appId: appData._id,
      },
      "Getting Square merchant access token",
    );

    if (!token?.accessToken || !token.refreshToken) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.app_not_configured" satisfies SquareAdminAllKeys,
      );
    }

    const expiresOn =
      token.expiresOn instanceof Date
        ? token.expiresOn
        : token.expiresOn
          ? new Date(token.expiresOn as unknown as string)
          : null;

    if (expiresOn && expiresOn.getTime() > Date.now() + 60_000) {
      logger.debug(
        { appId: appData._id },
        "Square OAuth access token is still valid",
      );

      return decrypt(token.accessToken);
    }

    logger.debug(
      { appId: appData._id },
      "Refreshing Square OAuth access token",
    );

    const clientId = process.env.SQUARE_APP_APPLICATION_ID;
    const clientSecret = process.env.SQUARE_APP_APPLICATION_SECRET;
    if (!clientId || !clientSecret) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.missing_oauth_config" satisfies SquareAdminAllKeys,
      );
    }

    const refreshPlain = decrypt(token.refreshToken);

    const res = await fetch(squareOAuthTokenUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": SQUARE_API_VERSION,
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshPlain,
      }),
    });

    const body = (await res.json()) as Record<string, unknown>;

    if (!res.ok || body.errors) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.token_refresh_failed" satisfies SquareAdminAllKeys,
      );
    }

    logger.debug(
      {
        appId: appData._id,
      },
      "Square OAuth access token refreshed",
    );

    const accessToken = body.access_token as string | undefined;
    const refreshToken =
      (body.refresh_token as string | undefined) ?? refreshPlain;
    const expiresAtRaw = body.expires_at as string | undefined;

    if (!accessToken || !expiresAtRaw) {
      throw new ConnectedAppError(
        "app_square_admin.statusText.token_refresh_failed" satisfies SquareAdminAllKeys,
      );
    }

    const nextToken: ConnectedOauthAppTokens = {
      accessToken: encrypt(accessToken),
      refreshToken: encrypt(refreshToken),
      expiresOn: new Date(expiresAtRaw),
    };

    await this.props.update({
      token: nextToken,
    });

    logger.debug(
      {
        appId: appData._id,
      },
      "Square OAuth access token updated",
    );

    return accessToken;
  }

  public async unInstall(
    appData: ConnectedAppData<SquareMerchantData>,
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
        "Cannot uninstall Square app: payments exist",
      );
      return {
        success: false,
        code: "cannot_uninstall_has_payments",
        error: {
          key: "app_square_admin.statusText.cannot_uninstall_has_payments" satisfies SquareAdminAllKeys,
        },
      };
    }

    return { success: true, code: "ok" };
  }
}

export default SquareConnectedApp;
