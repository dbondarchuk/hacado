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
  IPaymentsService,
  ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE,
  OrganizationDomainChangedPayload,
  Payment,
  PaymentFee,
  SyncedPaymentTransaction,
  systemEventSource,
} from "@hacado/types";
import { encrypt, getWebsiteDomain } from "@hacado/utils";
import Stripe from "stripe";
import { getStripeApplePayDomainAssociation } from "./apple-pay";
import { STRIPE_APP_NAME } from "./const";
import {
  isHacadoCheckoutPaymentIntent,
  feesFromStripeCharge as mapFeesFromStripeCharge,
  mapStripeChargeToIngestInput,
  StripeInStoreChargeInput,
} from "./map-charge";
import {
  StripeAccountData,
  stripeAccountDataSchema,
  stripeConfirmPaymentRequestSchema,
  stripeCreatePaymentIntentRequestSchema,
  StripeFormProps,
  StripeSyncSettingsRequest,
  stripeSyncSettingsRequestSchema,
} from "./models";
import {
  StripeAdminAllKeys,
  StripeAdminKeys,
  StripeAdminNamespace,
} from "./translations/types";
import {
  getStripeOAuthRedirectUri,
  stripeConnectAuthorizeBase,
  stripeConnectTokenUrl,
} from "./urls";

const CONNECTED_APPS_COLLECTION = "connected-apps";

/** Matches synced-payments ingest default match window. */
const DEFAULT_IN_STORE_MATCH_WINDOW_MINUTES = 120;

type InStoreChargeIngestResult = "ingested" | "skipped" | "already_exists";

/** Stripe metadata key for our internal payment intent id (current). */
const METADATA_HACADO_INTENT_ID = "hacadoIntentId";

function getHacadoIntentIdFromStripeMetadata(
  metadata: Stripe.Metadata | null,
): string | undefined {
  if (!metadata) {
    return undefined;
  }
  return metadata[METADATA_HACADO_INTENT_ID] ?? undefined;
}

class StripeConnectedApp
  implements
    IOAuthConnectedApp<StripeAccountData, ConnectedOauthAppTokens>,
    IPaymentProcessor,
    IConnectedAppWithWebhook<StripeAccountData, ConnectedOauthAppTokens>,
    IEventSubscriber
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "StripeConnectedApp",
      props.organizationId,
    );
  }

  private getStripeClient(): Stripe {
    const logger = this.loggerFactory("getStripeClient");
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      logger.error("Missing STRIPE_SECRET_KEY");
      throw new ConnectedAppError(
        "app_stripe_admin.statusText.missing_oauth_config" satisfies StripeAdminAllKeys,
      );
    }

    return new Stripe(key);
  }

  private stripeAccountOpts(
    appData: ConnectedAppData<StripeAccountData>,
  ): Stripe.RequestOptions {
    const logger = this.loggerFactory("stripeAccountOpts");
    if (!appData.data?.accountId) {
      logger.debug(
        { appId: appData._id },
        "Stripe connected account id missing",
      );

      throw new ConnectedAppError(
        "app_stripe_admin.statusText.app_not_configured" satisfies StripeAdminAllKeys,
      );
    }

    return { stripeAccount: appData.data.accountId };
  }

  public async getLoginUrl(appId: string): Promise<string> {
    const logger = this.loggerFactory("getLoginUrl");
    const clientId = process.env.STRIPE_CONNECT_CLIENT_ID?.trim();
    if (!clientId) {
      logger.error("Missing STRIPE_CONNECT_CLIENT_ID");
      throw new ConnectedAppError(
        "app_stripe_admin.statusText.missing_oauth_config" satisfies StripeAdminAllKeys,
      );
    }

    const authUrl = new URL(stripeConnectAuthorizeBase);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("scope", "read_write");
    authUrl.searchParams.set("state", appId);
    authUrl.searchParams.set("redirect_uri", getStripeOAuthRedirectUri());
    const url = authUrl.toString();

    logger.debug(
      { appId, redirectUri: getStripeOAuthRedirectUri() },
      "Built Stripe OAuth authorize URL",
    );

    return url;
  }

  public async processRedirect(
    request: ApiRequest,
  ): Promise<ConnectedAppResponse> {
    const logger = this.loggerFactory("processRedirect");
    const url = new URL(request.url);
    const appId = url.searchParams.get("state") as string;
    const denied = url.searchParams.get("error");

    if (denied === "access_denied") {
      logger.debug({ appId }, "Stripe OAuth access denied by user");
      return {
        appId: appId ?? "",
        error:
          "app_stripe_admin.statusText.access_denied" satisfies StripeAdminAllKeys,
      };
    }

    const code = url.searchParams.get("code");
    if (!appId) {
      logger.error(
        { url: request.url },
        "Redirect request does not contain app ID",
      );

      throw new ConnectedAppError(
        "app_stripe_admin.statusText.redirect_missing_app_id" satisfies StripeAdminAllKeys,
      );
    }

    if (!code) {
      logger.error(
        { appId },
        "Redirect request does not contain authorization code",
      );

      throw new ConnectedAppError(
        "app_stripe_admin.statusText.redirect_missing_code" satisfies StripeAdminAllKeys,
      );
    }

    const clientId = process.env.STRIPE_CONNECT_CLIENT_ID?.trim();
    const clientSecret = process.env.STRIPE_SECRET_KEY?.trim();
    if (!clientId || !clientSecret) {
      logger.error("Missing STRIPE_CONNECT_CLIENT_ID or STRIPE_SECRET_KEY");
      throw new ConnectedAppError(
        "app_stripe_admin.statusText.missing_oauth_config" satisfies StripeAdminAllKeys,
      );
    }

    try {
      logger.debug(
        { appId, hasCode: !!code },
        "Exchanging Stripe OAuth code for tokens",
      );

      const tokenRes = await fetch(stripeConnectTokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const tokenJson = (await tokenRes.json()) as {
        error?: string;
        error_description?: string;
        access_token?: string;
        refresh_token?: string;
        stripe_user_id?: string;
        livemode?: boolean;
      };

      if (!tokenRes.ok || tokenJson.error) {
        logger.error(
          { status: tokenRes.status, tokenJson },
          "Stripe OAuth token exchange failed",
        );
        throw new ConnectedAppError(
          "app_stripe_admin.statusText.oauth_error" satisfies StripeAdminAllKeys,
        );
      }

      const {
        access_token: accessToken,
        refresh_token: refreshToken,
        stripe_user_id: stripeUserId,
        livemode,
      } = tokenJson;
      if (!accessToken || !refreshToken || !stripeUserId) {
        throw new ConnectedAppError(
          "app_stripe_admin.statusText.not_authorized" satisfies StripeAdminAllKeys,
        );
      }

      const db = await this.props.getDbConnection();
      const existing = await db
        .collection<
          ConnectedAppData<StripeAccountData>
        >(CONNECTED_APPS_COLLECTION)
        .findOne({ _id: appId });

      const data: StripeAccountData = {
        accountId: stripeUserId,
        livemode: livemode === true,
        ...(existing?.data?.enableInStoreSync !== undefined
          ? { enableInStoreSync: existing.data.enableInStoreSync }
          : {}),
        ...(existing?.data?.matchWindowMinutes !== undefined
          ? { matchWindowMinutes: existing.data.matchWindowMinutes }
          : {}),
      };

      const parsed = stripeAccountDataSchema.safeParse(data);
      if (!parsed.success) {
        throw new ConnectedAppError(
          "app_stripe_admin.statusText.not_authorized" satisfies StripeAdminAllKeys,
        );
      }

      logger.debug(
        { appId, stripeUserId, livemode: parsed.data.livemode },
        "Stripe OAuth token exchange succeeded",
      );

      return {
        appId,
        token: {
          accessToken: encrypt(accessToken),
          refreshToken: encrypt(refreshToken),
          expiresOn: null,
        } satisfies ConnectedOauthAppTokens,
        data: parsed.data,
        account: { username: stripeUserId },
      };
    } catch (e: unknown) {
      logger.error(
        { url: request.url, error: e instanceof Error ? e.message : String(e) },
        "Stripe OAuth redirect failed",
      );

      return {
        appId,
        error:
          e instanceof ConnectedAppError
            ? e.key
            : ("app_stripe_admin.statusText.oauth_error" satisfies StripeAdminAllKeys),
        errorArgs: e instanceof ConnectedAppError ? e.args : undefined,
      };
    }
  }

  public async afterOAuthConnected(
    appData: ConnectedAppData<StripeAccountData>,
  ): Promise<void> {
    const logger = this.loggerFactory("afterOAuthConnected");
    logger.debug({ appId: appData._id }, "Stripe after OAuth connected");

    await this.ensureDefaultInStoreSyncSettings(appData);

    await this.registerApplePayDomain(appData);
  }

  protected async ensureDefaultInStoreSyncSettings(
    appData: ConnectedAppData<StripeAccountData>,
  ): Promise<void> {
    const data = appData.data;
    if (!data) {
      return;
    }

    const patch: Partial<StripeAccountData> = {};
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
    appData: ConnectedAppData<StripeAccountData>,
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
      "Organization domain changed, re-registering Stripe payment method domain",
    );

    await this.registerApplePayDomain(appData);
  }

  public async getApplePayDomainAssociation(
    _appData: ConnectedAppData<StripeAccountData>,
  ): Promise<string | null> {
    return getStripeApplePayDomainAssociation();
  }

  public getFormProps(
    appData: ConnectedAppData<StripeAccountData>,
  ): StripeFormProps {
    const logger = this.loggerFactory("getFormProps");
    logger.debug({ appId: appData._id }, "Getting Stripe form props");
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
    if (!publishableKey) {
      logger.error("Missing STRIPE_PUBLISHABLE_KEY");
      throw new ConnectedAppError(
        "app_stripe_admin.statusText.missing_oauth_config" satisfies StripeAdminAllKeys,
      );
    }

    if (!appData.data?.accountId) {
      logger.error("Stripe connected account id missing");
      throw new ConnectedAppError(
        "app_stripe_admin.statusText.app_not_configured" satisfies StripeAdminAllKeys,
      );
    }

    logger.debug(
      { appId: appData._id, stripeAccountId: appData.data.accountId },
      "Stripe getFormProps for checkout",
    );

    return {
      publishableKey,
      stripeAccountId: appData.data.accountId,
    };
  }

  public async processRequest(
    appData: ConnectedAppData<StripeAccountData>,
    request: StripeSyncSettingsRequest,
  ): Promise<
    ConnectedAppStatusWithText<StripeAdminNamespace, StripeAdminKeys>
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id },
      "Processing Stripe sync settings request",
    );

    if (!appData.data?.accountId) {
      throw new ConnectedAppError(
        "app_stripe_admin.statusText.app_not_configured" satisfies StripeAdminAllKeys,
      );
    }

    const { data, success, error } =
      stripeSyncSettingsRequestSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid Stripe sync settings request");
      throw new ConnectedAppRequestError(
        "invalid_stripe_sync_settings_request",
        { error },
        400,
        error.message,
      );
    }

    const merged: StripeAccountData = {
      ...appData.data,
      enableInStoreSync: data.enableInStoreSync,
      matchWindowMinutes: data.matchWindowMinutes,
    };

    const parsed = stripeAccountDataSchema.safeParse(merged);
    if (!parsed.success) {
      throw new ConnectedAppError(
        "app_stripe_admin.statusText.app_not_configured" satisfies StripeAdminAllKeys,
      );
    }

    await this.props.update({ data: parsed.data });

    return {
      status: "connected",
      statusText:
        "app_stripe_admin.statusText.sync_settings_saved" satisfies StripeAdminAllKeys,
    };
  }

  public async processAppCall(
    appData: ConnectedAppData<StripeAccountData>,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse | undefined> {
    const logger = this.loggerFactory("processAppCall");
    logger.debug(
      {
        appId: appData._id,
        slug: slug.join("/"),
        method: request.method,
      },
      "Stripe processAppCall",
    );
    if (request.method.toUpperCase() !== "POST") {
      logger.debug(
        { slug: slug.join("/") },
        "Stripe processAppCall method not handled",
      );
      return undefined;
    }

    if (slug.length === 1 && slug[0] === "create-payment-intent") {
      try {
        logger.debug({ appId: appData._id }, "Creating Stripe PaymentIntent");
        const body = await request.json();
        const parsed = stripeCreatePaymentIntentRequestSchema.safeParse(body);
        if (!parsed.success) {
          logger.debug(
            { error: parsed.error.message },
            "Stripe create-payment-intent validation failed",
          );
          return Response.json(
            { error: "invalid_request", message: parsed.error.message },
            { status: 400 },
          );
        }
        return await this.handleCreatePaymentIntent(
          appData,
          parsed.data.paymentIntentId,
        );
      } catch (e: unknown) {
        logger.error(
          { appId: appData._id, error: e instanceof Error ? e.message : e },
          "Stripe create payment intent error",
        );
        throw e;
      }
    }

    if (slug.length === 1 && slug[0] === "confirm-payment") {
      try {
        logger.debug({ appId: appData._id }, "Confirming Stripe payment");
        const body = await request.json();
        const parsed = stripeConfirmPaymentRequestSchema.safeParse(body);
        if (!parsed.success) {
          logger.debug(
            { error: parsed.error.message },
            "Stripe confirm-payment validation failed",
          );

          return Response.json(
            { error: "invalid_request", message: parsed.error.message },
            { status: 400 },
          );
        }

        return await this.handleConfirmPayment(
          appData,
          parsed.data.paymentIntentId,
          parsed.data.stripePaymentIntentId,
        );
      } catch (e: unknown) {
        logger.error(
          { appId: appData._id, error: e instanceof Error ? e.message : e },
          "Stripe confirm payment error",
        );
        throw e;
      }
    }

    logger.debug(
      { slug: slug.join("/") },
      "Stripe processAppCall no matching handler",
    );
    return undefined;
  }

  private async handleCreatePaymentIntent(
    appData: ConnectedAppData<StripeAccountData>,
    hacadoIntentId: string,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("handleCreatePaymentIntent");
    logger.debug(
      { appId: appData._id, hacadoIntentId },
      "Creating Stripe PaymentIntent for internal intent",
    );

    const intent =
      await this.props.services.paymentsService.getIntent(hacadoIntentId);
    if (!intent) {
      logger.debug({ hacadoIntentId }, "Internal payment intent not found");
      return Response.json({ error: "intent_not_found" }, { status: 404 });
    }

    if (intent.appId !== appData._id) {
      logger.debug(
        {
          hacadoIntentId,
          expectedAppId: appData._id,
          intentAppId: intent.appId,
        },
        "Intent app id mismatch for Stripe",
      );
      return Response.json({ error: "intent_app_mismatch" }, { status: 403 });
    }

    if (intent.status === "paid") {
      logger.debug(
        { hacadoIntentId },
        "Internal intent already paid, not creating Stripe PI",
      );
      return Response.json({ error: "intent_already_paid" }, { status: 400 });
    }

    if (intent.status === "failed") {
      logger.debug(
        { hacadoIntentId, status: intent.status },
        "Internal intent in failed state",
      );
      return Response.json({ error: "intent_failed" }, { status: 400 });
    }

    const stripe = this.getStripeClient();
    const { currency } =
      await this.props.services.configurationService.getConfiguration(
        "general",
      );

    const currencyCode = (currency as string).toLowerCase();
    const amountCents = Math.round(intent.amount * 100);
    if (amountCents < 1) {
      logger.debug(
        { amountCents, amount: intent.amount },
        "Amount too low for Stripe PaymentIntent",
      );
      return Response.json({ error: "amount_too_low" }, { status: 400 });
    }

    const idempotencyKey = `hacado_pi_${hacadoIntentId}_${amountCents}`;

    if (intent.externalId) {
      const existing = await stripe.paymentIntents.retrieve(
        intent.externalId,
        this.stripeAccountOpts(appData),
      );

      logger.debug(
        {
          stripePaymentIntentId: existing.id,
          status: existing.status,
          hasClientSecret: !!existing.client_secret,
        },
        "Retrieved existing Stripe PaymentIntent for internal intent",
      );
      if (existing.status === "succeeded") {
        return Response.json({ error: "intent_already_paid" }, { status: 400 });
      }

      const existingAmount = existing.amount;
      const existingHacadoId = getHacadoIntentIdFromStripeMetadata(
        existing.metadata,
      );

      if (
        existingAmount === amountCents &&
        existingHacadoId === hacadoIntentId &&
        (existing.status === "requires_payment_method" ||
          existing.status === "requires_confirmation" ||
          existing.status === "requires_action" ||
          existing.status === "processing") &&
        !!existing.client_secret
      ) {
        logger.debug(
          { stripePaymentIntentId: existing.id },
          "Reusing in-progress Stripe PaymentIntent",
        );

        return Response.json({ clientSecret: existing.client_secret });
      }

      try {
        logger.debug(
          { stripePaymentIntentId: existing.id },
          "Cancelling previous Stripe PaymentIntent before creating a new one",
        );

        await stripe.paymentIntents.cancel(
          existing.id,
          this.stripeAccountOpts(appData),
        );

        logger.debug(
          { stripePaymentIntentId: existing.id },
          "Cancelled previous Stripe PaymentIntent before creating a new one",
        );
      } catch (cancelErr: unknown) {
        logger.debug(
          {
            stripePaymentIntentId: existing.id,
            err:
              cancelErr instanceof Error
                ? cancelErr.message
                : String(cancelErr),
          },
          "Could not cancel previous Stripe PaymentIntent; will create new and overwrite externalId",
        );
      }
    }

    const created = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: currencyCode,
        automatic_payment_methods: { enabled: true },
        metadata: {
          [METADATA_HACADO_INTENT_ID]: intent._id,
          organizationId: appData.organizationId,
          appId: appData._id,
        },
      },
      { ...this.stripeAccountOpts(appData), idempotencyKey },
    );

    logger.debug(
      {
        hacadoIntentId: intent._id,
        stripePaymentIntentId: created.id,
        amountCents,
        currency: currencyCode,
        idempotencyKey,
      },
      "Created Stripe PaymentIntent for internal intent",
    );

    if (!created.client_secret) {
      logger.error("Stripe payment intent has no client_secret");
      return Response.json(
        { error: "could_not_create_intent" },
        { status: 500 },
      );
    }

    await this.props.services.paymentsService.updateIntent(intent._id, {
      externalId: created.id,
    });

    return Response.json({ clientSecret: created.client_secret });
  }

  private async handleConfirmPayment(
    appData: ConnectedAppData<StripeAccountData>,
    hacadoIntentId: string,
    stripePaymentIntentId?: string,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("handleConfirmPayment");
    logger.debug(
      { appId: appData._id, hacadoIntentId, stripePaymentIntentId },
      "Confirming Stripe payment for internal intent",
    );

    const intent =
      await this.props.services.paymentsService.getIntent(hacadoIntentId);
    if (!intent) {
      logger.debug(
        { hacadoIntentId },
        "Internal payment intent not found for confirm",
      );
      return Response.json({ error: "intent_not_found" }, { status: 404 });
    }

    if (intent.appId !== appData._id) {
      logger.debug(
        {
          hacadoIntentId,
          expectedAppId: appData._id,
          intentAppId: intent.appId,
        },
        "Intent app id mismatch for confirm",
      );
      return Response.json({ error: "intent_app_mismatch" }, { status: 403 });
    }

    const piId = intent.externalId ?? stripePaymentIntentId;
    if (!piId) {
      logger.debug(
        { hacadoIntentId },
        "No Stripe PaymentIntent id on internal intent for confirm",
      );
      return Response.json(
        { error: "missing_stripe_payment_intent" },
        { status: 400 },
      );
    }

    const stripe = this.getStripeClient();
    const pi = await stripe.paymentIntents.retrieve(
      piId,
      { expand: ["latest_charge.balance_transaction", "latest_charge"] },
      this.stripeAccountOpts(appData),
    );

    logger.debug(
      { stripePaymentIntentId: pi.id, status: pi.status },
      "Retrieved Stripe PaymentIntent for confirm",
    );

    if (pi.status !== "succeeded") {
      logger.debug(
        { stripePaymentIntentId: pi.id, status: pi.status },
        "Stripe PaymentIntent not succeeded on confirm",
      );
      return Response.json(
        { success: false, error: "payment_incomplete" },
        { status: 400 },
      );
    }

    if (intent.status === "paid") {
      const fees = this.feesFromPaymentIntent(pi);
      if (fees?.length) {
        const applied = await this.applyStripeFeesToPayment(
          this.props.services.paymentsService,
          pi.id,
          fees,
        );
        logger.debug(
          {
            hacadoIntentId: intent._id,
            stripePaymentIntentId: pi.id,
            feeCount: fees.length,
            appliedToPayment: applied,
          },
          applied
            ? "Updated payment fees on confirm (intent was already paid)"
            : "No payment row for PI yet; fee data not stored on confirm",
        );
      } else {
        logger.debug(
          { hacadoIntentId: intent._id, stripePaymentIntentId: pi.id },
          "Internal intent already paid; no fee data on PaymentIntent, skipping fee update",
        );
      }
      return Response.json({ success: true });
    }

    const fees = this.feesFromPaymentIntent(pi);
    await this.props.services.paymentsService.updateIntent(intent._id, {
      status: "paid",
      externalId: pi.id,
    });
    const feesApplied = await this.applyStripeFeesToPayment(
      this.props.services.paymentsService,
      pi.id,
      fees,
    );

    logger.debug(
      {
        hacadoIntentId: intent._id,
        stripePaymentIntentId: pi.id,
        hasFees: !!fees?.length,
        feesAppliedToPayment: feesApplied,
      },
      "Marked internal intent paid after Stripe confirm",
    );
    return Response.json({ success: true, paymentIntentId: pi.id });
  }

  /**
   * Persists processor fees on the **Payment** document only (`externalId` is the Stripe PaymentIntent id).
   * Returns whether a payment row was found and updated.
   */
  private async applyStripeFeesToPayment(
    paymentService: IPaymentsService,
    stripePaymentIntentId: string,
    fees: PaymentFee[] | undefined,
  ): Promise<boolean> {
    if (!fees?.length) {
      return false;
    }

    const payment = await paymentService.getPaymentByExternalId(
      stripePaymentIntentId,
    );
    if (!payment) {
      return false;
    }

    await paymentService.updatePayment(
      payment._id,
      { fees },
      {
        actor: "system",
      },
    );
    return true;
  }

  private feesFromCharge(ch: Stripe.Charge): PaymentFee[] | undefined {
    const fees = mapFeesFromStripeCharge(ch);
    return fees.length ? fees : undefined;
  }

  private feesFromPaymentIntent(
    pi: Stripe.PaymentIntent,
  ): PaymentFee[] | undefined {
    const ch = pi.latest_charge;
    if (typeof ch === "string" || ch == null) {
      return undefined;
    }

    return this.feesFromCharge(ch);
  }

  public async refundPayment(
    appData: ConnectedAppData<StripeAccountData>,
    payment: Payment,
    amount: number,
  ): Promise<{ success: boolean; error?: string }> {
    const logger = this.loggerFactory("refundPayment");
    logger.debug(
      { appId: appData._id, paymentId: payment._id, amount },
      "Refunding Stripe payment",
    );

    if (
      payment.method !== "online" ||
      (payment as { appName?: string }).appName !== STRIPE_APP_NAME ||
      !(payment as { externalId?: string }).externalId
    ) {
      logger.warn(
        {
          appId: appData._id,
          paymentId: payment._id,
          appName: (payment as { appName?: string }).appName,
        },
        "Stripe refund not supported for this payment",
      );

      return { success: false, error: "not_supported" };
    }

    const externalId = (payment as { externalId: string }).externalId;
    try {
      const stripe = this.getStripeClient();
      const idempotencyKey =
        `re_${payment._id}_${Math.round(amount * 100)}`.slice(0, 50);
      await stripe.refunds.create(
        { payment_intent: externalId, amount: Math.round(amount * 100) },
        { ...this.stripeAccountOpts(appData), idempotencyKey },
      );

      logger.debug({ appId: appData._id, externalId }, "Stripe refund created");
      return { success: true };
    } catch (e: unknown) {
      logger.error(
        { error: e instanceof Error ? e.message : e },
        "Stripe refund error",
      );
      return { success: false, error: "refund_failed" };
    }
  }

  public async processStaticWebhook(
    request: ApiRequest,
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("processStaticWebhook");
    logger.debug(
      { method: request.method, url: request.url },
      "Stripe static webhook request",
    );

    if (request.method.toUpperCase() !== "POST") {
      logger.debug(
        { method: request.method },
        "Stripe webhook method not POST",
      );
      return new Response(null, { status: 405 });
    }

    const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!whSecret) {
      logger.warn("STRIPE_WEBHOOK_SECRET not set");
      return Response.json(
        { error: "webhook_not_configured" },
        { status: 503 },
      );
    }

    const rawBody = await request.text();
    const signature =
      request.headers.get("Stripe-Signature") ??
      request.headers.get("stripe-signature");

    if (!signature) {
      return Response.json(
        { error: "invalid_webhook_signature" },
        { status: 400 },
      );
    }

    let event: Stripe.Event;
    try {
      event = this.getStripeClient().webhooks.constructEvent(
        rawBody,
        signature,
        whSecret,
      );
    } catch (err: unknown) {
      logger.warn(
        { err: err instanceof Error ? err.message : err },
        "Stripe webhook signature failed",
      );
      return Response.json(
        { error: "invalid_webhook_signature" },
        { status: 400 },
      );
    }

    logger.debug(
      { eventId: event.id, type: event.type, livemode: event.livemode },
      "Stripe webhook event parsed",
    );

    const connectAccount = (event as Stripe.Event & { account?: string | null })
      .account;

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        return await this.onPaymentIntentSucceeded(
          pi,
          connectAccount ?? undefined,
          getOrganizationServiceContainer,
        );
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        return await this.onPaymentIntentFailed(
          pi,
          getOrganizationServiceContainer,
        );
      }
      case "charge.updated":
      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        return await this.syncFeesFromStripeChargeWebhook(
          charge,
          connectAccount ?? undefined,
          getOrganizationServiceContainer,
          event.type,
        );
      }
      case "account.application.deauthorized": {
        return await this.onAccountDeauthorized(
          event,
          getOrganizationServiceContainer,
        );
      }
      default:
        logger.debug(
          { type: event.type, eventId: event.id },
          "Stripe webhook event type not handled",
        );
        return Response.json({ received: true });
    }
  }

  private async onPaymentIntentSucceeded(
    pi: Stripe.PaymentIntent,
    connectAccount: string | undefined,
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("onPaymentIntentSucceeded");
    const orgId = pi.metadata?.organizationId;
    const hacadoIntentId = getHacadoIntentIdFromStripeMetadata(pi.metadata);
    if (!orgId || !hacadoIntentId) {
      logger.debug(
        {
          stripePaymentIntentId: pi.id,
          hasOrg: !!orgId,
          hasIntentId: !!hacadoIntentId,
        },
        "Stripe PI missing org or hacado intent id in metadata, ignoring",
      );
      return Response.json({ received: true });
    }

    const props = getOrganizationServiceContainer(orgId);
    const paymentService = props.services.paymentsService;
    const intent = await paymentService.getIntent(hacadoIntentId);
    if (!intent) {
      logger.warn(
        { hacadoIntentId, stripePaymentIntentId: pi.id },
        "Internal payment intent not found for Stripe webhook",
      );
      return Response.json({ received: true });
    }

    if (intent.appName !== STRIPE_APP_NAME) {
      logger.debug(
        { hacadoIntentId, appName: intent.appName },
        "Internal intent is not for Stripe app, ignoring webhook",
      );
      return Response.json({ received: true });
    }

    if (pi.status !== "succeeded") {
      logger.debug(
        { stripePaymentIntentId: pi.id, status: pi.status },
        "Stripe PI not succeeded, skipping",
      );
      return Response.json({ received: true });
    }

    const accountId =
      connectAccount ??
      (intent.appId
        ? await this.findStripeAccountIdForApp(intent.appId, props)
        : null);

    if (!accountId) {
      logger.debug(
        { hacadoIntentId, hasConnectAccount: !!connectAccount },
        "Could not resolve Stripe connected account for webhook retrieve",
      );
      return Response.json({ received: true });
    }

    const retrieveResult = await this.getStripeClient().paymentIntents.retrieve(
      pi.id,
      { expand: ["latest_charge.balance_transaction", "latest_charge"] },
      { stripeAccount: accountId },
    );

    const fees = this.feesFromPaymentIntent(retrieveResult);

    if (intent.status === "paid") {
      if (fees?.length) {
        const applied = await this.applyStripeFeesToPayment(
          paymentService,
          retrieveResult.id,
          fees,
        );
        logger.debug(
          {
            hacadoIntentId,
            stripePaymentIntentId: retrieveResult.id,
            feeCount: fees.length,
            appliedToPayment: applied,
          },
          applied
            ? "Updated payment fees from payment_intent.succeeded (intent already paid)"
            : "Intent already paid; no payment row for PI yet (fees apply when payment exists or via charge webhook)",
        );
      } else {
        logger.debug(
          { hacadoIntentId, stripePaymentIntentId: retrieveResult.id },
          "Intent already paid; fee data not ready on PI (expect charge.updated / charge.succeeded)",
        );
      }
      return Response.json({ received: true });
    }

    await paymentService.updateIntent(hacadoIntentId, {
      status: "paid",
      externalId: retrieveResult.id,
    });
    const feesApplied = await this.applyStripeFeesToPayment(
      paymentService,
      retrieveResult.id,
      fees,
    );

    logger.debug(
      {
        hacadoIntentId,
        stripePaymentIntentId: retrieveResult.id,
        feeCount: fees?.length ?? 0,
        feesAppliedToPayment: feesApplied,
      },
      fees?.length && feesApplied
        ? "Marked internal intent paid via Stripe webhook (fees on payment)"
        : fees?.length
          ? "Marked internal intent paid via Stripe webhook (fees pending payment row or charge webhook)"
          : "Marked internal intent paid via Stripe webhook (fees pending; listen for charge.updated / charge.succeeded)",
    );
    return Response.json({ received: true });
  }

  /**
   * Balance transaction / fee is often finalized after `payment_intent.succeeded`.
   * Subscribe to `charge.updated` and `charge.succeeded` on the Stripe webhook endpoint.
   */
  private async syncFeesFromStripeChargeWebhook(
    charge: Stripe.Charge,
    connectAccount: string | undefined,
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
    stripeEventType: "charge.updated" | "charge.succeeded",
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("syncFeesFromStripeChargeWebhook");
    logger.debug(
      { chargeId: charge.id, stripeEventType },
      "Handling charge webhook for fee sync",
    );

    const paymentIntentRef = charge.payment_intent;
    const paymentIntentId =
      typeof paymentIntentRef === "string"
        ? paymentIntentRef
        : paymentIntentRef &&
            typeof paymentIntentRef === "object" &&
            "id" in paymentIntentRef
          ? paymentIntentRef.id
          : null;

    if (!paymentIntentId) {
      if (stripeEventType === "charge.succeeded" && connectAccount) {
        return await this.tryIngestInStoreChargeFromWebhook(
          charge,
          connectAccount,
          null,
          getOrganizationServiceContainer,
        );
      }

      logger.debug(
        { chargeId: charge.id },
        "Charge has no PaymentIntent, ignoring",
      );
      return Response.json({ received: true });
    }

    const stripe = this.getStripeClient();
    /** Connect events include `account`; standard platform charges omit it. */
    const accountOpts: Stripe.RequestOptions | undefined = connectAccount
      ? { stripeAccount: connectAccount }
      : {};

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        {},
        accountOpts,
      );
    } catch (e: unknown) {
      logger.warn(
        {
          chargeId: charge.id,
          paymentIntentId,
          error: e instanceof Error ? e.message : String(e),
        },
        `Could not retrieve PaymentIntent for ${stripeEventType}`,
      );
      return Response.json({ received: true });
    }

    logger.debug(
      { piId: paymentIntentId, status: paymentIntent.status, stripeEventType },
      "Retrieved PaymentIntent for charge fee webhook",
    );

    const orgId = paymentIntent.metadata?.organizationId;
    const hacadoIntentId = getHacadoIntentIdFromStripeMetadata(
      paymentIntent.metadata,
    );

    if (!orgId || !hacadoIntentId) {
      if (stripeEventType === "charge.succeeded" && connectAccount) {
        if (isHacadoCheckoutPaymentIntent(paymentIntent.metadata)) {
          logger.debug(
            { chargeId: charge.id, piId: paymentIntentId },
            "Hacado checkout charge, skipping in-store ingest",
          );
          return Response.json({ received: true });
        }

        return await this.tryIngestInStoreChargeFromWebhook(
          charge,
          connectAccount,
          paymentIntent,
          getOrganizationServiceContainer,
        );
      }

      logger.debug(
        {
          chargeId: charge.id,
          piId: paymentIntentId,
          hasOrg: !!orgId,
          hasHacadoIntent: !!hacadoIntentId,
        },
        `PI metadata missing org or hacado intent id, ignoring ${stripeEventType}`,
      );
      return Response.json({ received: true });
    }

    const props = getOrganizationServiceContainer(orgId);
    const paymentService = props.services.paymentsService;
    const intent = await paymentService.getIntent(hacadoIntentId);
    if (!intent) {
      logger.warn(
        { hacadoIntentId, chargeId: charge.id },
        `Internal payment intent not found for ${stripeEventType}`,
      );
      return Response.json({ received: true });
    }

    if (intent.appName !== STRIPE_APP_NAME) {
      return Response.json({ received: true });
    }

    let chargeWithBt: Stripe.Charge;
    try {
      chargeWithBt = await stripe.charges.retrieve(
        charge.id,
        { expand: ["balance_transaction"] },
        accountOpts,
      );
    } catch (e: unknown) {
      logger.warn(
        {
          chargeId: charge.id,
          error: e instanceof Error ? e.message : String(e),
        },
        `Could not retrieve Charge with balance_transaction for ${stripeEventType}`,
      );
      return Response.json({ received: true });
    }

    const fees = this.feesFromCharge(chargeWithBt);
    if (!fees?.length) {
      logger.debug(
        { hacadoIntentId, chargeId: charge.id },
        "No fee data on charge after retrieve, skipping",
      );
      return Response.json({ received: true });
    }

    const applied = await this.applyStripeFeesToPayment(
      paymentService,
      paymentIntentId,
      fees,
    );

    logger.debug(
      {
        hacadoIntentId,
        chargeId: charge.id,
        feeCount: fees.length,
        appliedToPayment: applied,
      },
      applied
        ? `Updated payment fees from ${stripeEventType}`
        : `No payment row for PI ${paymentIntentId} yet; fees not stored (${stripeEventType})`,
    );
    return Response.json({ received: true });
  }

  protected async findConnectedAppsByAccountId(
    accountId: string,
  ): Promise<ConnectedAppData<StripeAccountData>[]> {
    const db = await this.props.getDbConnection();
    return db
      .collection<ConnectedAppData<StripeAccountData>>(
        CONNECTED_APPS_COLLECTION,
      )
      .find({
        name: STRIPE_APP_NAME,
        status: "connected",
        "data.accountId": accountId,
      })
      .toArray();
  }

  protected async tryIngestInStoreChargeFromWebhook(
    charge: Stripe.Charge,
    connectAccount: string,
    paymentIntent: Stripe.PaymentIntent | null,
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("tryIngestInStoreChargeFromWebhook");

    if (
      paymentIntent &&
      isHacadoCheckoutPaymentIntent(paymentIntent.metadata)
    ) {
      return Response.json({ received: true });
    }

    const appDocs = await this.findConnectedAppsByAccountId(connectAccount);
    const enabledApps = appDocs.filter((app) => app.data?.enableInStoreSync);

    if (!enabledApps.length) {
      logger.debug(
        {
          stripeAccountId: connectAccount,
          chargeId: charge.id,
          connectedAppCount: appDocs.length,
        },
        "No connected Stripe apps with in-store sync enabled for account",
      );
      return Response.json({ received: true });
    }

    const accountOpts = { stripeAccount: connectAccount };

    let chargeWithBt: Stripe.Charge;
    try {
      chargeWithBt = await this.getStripeClient().charges.retrieve(
        charge.id,
        { expand: ["balance_transaction"] },
        accountOpts,
      );
    } catch (e: unknown) {
      logger.warn(
        {
          chargeId: charge.id,
          error: e instanceof Error ? e.message : String(e),
        },
        "Could not retrieve Stripe charge for in-store ingest",
      );
      return Response.json({ received: true });
    }

    const input = mapStripeChargeToIngestInput(chargeWithBt);
    if (!input) {
      return Response.json({ received: true });
    }

    for (const appDoc of enabledApps) {
      const orgProps = getOrganizationServiceContainer(appDoc.organizationId);
      const appInstance = new StripeConnectedApp(orgProps);
      try {
        await appInstance.ingestInStoreCharge(appDoc, input, paymentIntent);
      } catch (error) {
        logger.error(
          {
            appId: appDoc._id,
            organizationId: appDoc.organizationId,
            chargeId: charge.id,
            error,
          },
          "Failed to ingest Stripe in-store charge for connected app",
        );
      }
    }

    return Response.json({ received: true });
  }

  /**
   * Normalizes an in-store Stripe charge and ingests it into synced payments.
   */
  protected async ingestInStoreCharge(
    appData: ConnectedAppData<StripeAccountData>,
    input: StripeInStoreChargeInput,
    paymentIntent?: Stripe.PaymentIntent | null,
  ): Promise<InStoreChargeIngestResult> {
    const logger = this.loggerFactory("ingestInStoreCharge");
    const config = appData.data;
    const { paymentsService, syncedPaymentsService } = this.props.services;

    const piId =
      typeof paymentIntent?.id === "string" ? paymentIntent.id : undefined;

    const existingPayment =
      (await paymentsService.getPaymentByExternalId(input.chargeId)) ??
      (piId ? await paymentsService.getPaymentByExternalId(piId) : null);
    if (existingPayment) {
      logger.debug(
        { appId: appData._id, chargeId: input.chargeId },
        "Charge already recorded as payment, skipping in-store ingest",
      );
      return "already_exists";
    }

    const onlineIntent =
      (await paymentsService.getIntentByExternalId(input.chargeId)) ??
      (piId ? await paymentsService.getIntentByExternalId(piId) : null);
    if (onlineIntent) {
      logger.debug(
        { appId: appData._id, chargeId: input.chargeId, piId },
        "Charge belongs to tracked online checkout, skipping in-store ingest",
      );
      return "skipped";
    }

    const existingSynced = await syncedPaymentsService.list({
      externalId: input.chargeId,
      limit: 0,
    });

    if (existingSynced.total > 0) {
      logger.debug(
        { appId: appData._id, chargeId: input.chargeId },
        "Charge already ingested as synced payment, skipping",
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
      appName: STRIPE_APP_NAME,
      externalId: input.chargeId,
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
          chargeId: input.chargeId,
          error: error instanceof Error ? error.message : error,
        },
        "Failed to ingest synced Stripe payment",
      );
      throw error;
    }

    logger.info(
      {
        appId: appData._id,
        chargeId: input.chargeId,
        amount: input.amount,
      },
      "Successfully ingested Stripe in-store payment",
    );

    return "ingested";
  }

  /**
   * Registers the booking site hostname on the Stripe **connected account** via
   * PaymentMethodDomains (required for Apple Pay in Elements on that origin).
   */
  protected async registerApplePayDomain(
    appData: ConnectedAppData<StripeAccountData>,
  ): Promise<void> {
    const logger = this.loggerFactory("registerApplePayDomain");
    logger.debug(
      { appId: appData._id },
      "Registering Stripe payment method domain",
    );

    const organization =
      await this.props.services.organizationService.getOrganization();

    if (!organization) {
      throw new ConnectedAppError(
        "app_stripe_admin.statusText.apple_pay_domain_registration_failed" satisfies StripeAdminAllKeys,
      );
    }

    const domain = getWebsiteDomain(organization);
    logger.debug({ domain }, "Stripe payment method domain name");

    const stripe = this.getStripeClient();
    const accountOpts = this.stripeAccountOpts(appData);

    let paymentMethodDomain: Stripe.PaymentMethodDomain;
    const existing = await stripe.paymentMethodDomains.list(
      { domain_name: domain, limit: 5 },
      accountOpts,
    );

    if (existing.data.length > 0) {
      paymentMethodDomain = existing.data[0]!;
      logger.debug(
        { appId: appData._id, id: paymentMethodDomain.id },
        "Using existing Stripe payment method domain",
      );
    } else {
      try {
        paymentMethodDomain = await stripe.paymentMethodDomains.create(
          { domain_name: domain, enabled: true },
          accountOpts,
        );
      } catch (e: unknown) {
        logger.error(
          {
            appId: appData._id,
            domain,
            error: e instanceof Error ? e.message : String(e),
          },
          "Stripe create payment method domain failed",
        );
        throw new ConnectedAppError(
          "app_stripe_admin.statusText.apple_pay_domain_registration_failed" satisfies StripeAdminAllKeys,
        );
      }
    }

    if (paymentMethodDomain.apple_pay.status === "active") {
      logger.debug(
        { appId: appData._id, id: paymentMethodDomain.id },
        "Stripe Apple Pay already active for payment method domain",
      );
      return;
    }

    try {
      const validated = await stripe.paymentMethodDomains.validate(
        paymentMethodDomain.id,
        {},
        accountOpts,
      );
      logger.debug(
        {
          appId: appData._id,
          id: validated.id,
          applePay: validated.apple_pay.status,
        },
        "Stripe payment method domain validate completed",
      );
    } catch (e: unknown) {
      logger.warn(
        {
          appId: appData._id,
          pmdId: paymentMethodDomain.id,
          domain,
          error: e instanceof Error ? e.message : String(e),
        },
        "Stripe payment method domain validate failed (ensure /.well-known file is served and env association is set)",
      );
    }
  }

  private async findStripeAccountIdForApp(
    appId: string,
    props: IConnectedAppProps,
  ): Promise<string | null> {
    const logger = this.loggerFactory("findStripeAccountIdForApp");
    const app = await props.services.connectedAppsService.getApp(appId);
    const id = (app.data as { accountId?: string } | undefined)?.accountId;

    logger.debug(
      { appId, stripeAccountId: id ?? null },
      "Resolved Stripe connected account for connected app",
    );
    return id ?? null;
  }

  private async onPaymentIntentFailed(
    pi: Stripe.PaymentIntent,
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("onPaymentIntentFailed");
    const orgId = pi.metadata?.organizationId;
    const hacadoIntentId = getHacadoIntentIdFromStripeMetadata(pi.metadata);
    logger.debug(
      { orgId, hacadoIntentId },
      "Finding Stripe account id for app",
    );

    if (!orgId || !hacadoIntentId) {
      logger.debug(
        { stripePaymentIntentId: pi.id },
        "Failed PI missing org or hacado intent id in metadata",
      );
      return Response.json({ received: true });
    }

    const paymentService =
      getOrganizationServiceContainer(orgId).services.paymentsService;
    const intent = await paymentService.getIntent(hacadoIntentId);
    if (!intent || intent.status === "paid") {
      logger.debug(
        { hacadoIntentId, hasIntent: !!intent, status: intent?.status },
        "Skipping failed-webhook update",
      );
      return Response.json({ received: true });
    }

    await paymentService.updateIntent(hacadoIntentId, { status: "failed" });
    logger.debug(
      { hacadoIntentId, stripePaymentIntentId: pi.id },
      "Marked internal intent failed from Stripe payment_intent.payment_failed",
    );

    return Response.json({ received: true });
  }

  private async onAccountDeauthorized(
    event: Stripe.Event,
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("onAccountDeauthorized");
    const accountId = event.account;
    if (!accountId) {
      logger.debug("account.application.deauthorized without account id");
      return Response.json({ received: true });
    }

    const db = await this.props.getDbConnection();
    const col = db.collection<ConnectedAppData<StripeAccountData>>(
      CONNECTED_APPS_COLLECTION,
    );

    const appDocs = await col
      .find({
        name: STRIPE_APP_NAME,
        "data.accountId": accountId,
      })
      .toArray();

    if (!appDocs.length) {
      logger.debug(
        { stripeAccountId: accountId },
        "No connected Stripe app documents for deauthorized account",
      );
      return Response.json({ received: true });
    }

    for (const doc of appDocs) {
      if (!doc._id) {
        continue;
      }

      const cas = getOrganizationServiceContainer(doc.organizationId).services
        .connectedAppsService;
      await cas.updateApp(doc._id, {
        status: "failed",
        statusText:
          "app_stripe_admin.statusText.access_denied" satisfies StripeAdminAllKeys,
      });

      logger.debug(
        {
          appId: doc._id,
          organizationId: doc.organizationId,
          stripeAccountId: accountId,
        },
        "Marked Stripe connected app failed after account.application.deauthorized",
      );
    }

    return Response.json({ received: true });
  }

  public async unInstall(
    appData: ConnectedAppData<StripeAccountData>,
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
        "Cannot uninstall Stripe app: payments exist",
      );
      return {
        success: false,
        code: "cannot_uninstall_has_payments",
        error: {
          key: "app_stripe_admin.statusText.cannot_uninstall_has_payments" satisfies StripeAdminAllKeys,
        },
      };
    }

    return { success: true, code: "ok" };
  }
}

export default StripeConnectedApp;
