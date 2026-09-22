import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  canUseFeature,
  resolvePlanTierFromOrganization,
} from "@hacado/services/billing";
import {
  ApiRequest,
  ApiResponse,
  CollectPayment,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppStatusWithText,
  CreatePaymentLinkRequest,
  CUSTOMER_SESSION_COOKIE,
  customerEventSource,
  EventEnvelope,
  ICommunicationTemplatesProvider,
  IConnectedApp,
  IConnectedAppProps,
  IEventSubscriber,
  IPaymentLinkProvider,
  IPaymentProcessor,
  IPublicPageProvider,
  Payment,
  PAYMENT_INTENT_PAID_EVENT_TYPE,
  PaymentIntentPaidPayload,
  PaymentIntentUpdateModel,
  PaymentLinkPayment,
  PaymentLinkResult,
  PublicPageChrome,
  PublicPageChromeContext,
  PublicPageClaim,
  readCookieValue,
  resolvePageHeaderPosition,
  SendPaymentLinkRequest,
  systemEventSource,
  TemplateTemplatesList,
} from "@hacado/types";
import {
  formatAmountWithCurrency,
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  templateSafeWithError,
} from "@hacado/utils";
import { randomBytes } from "crypto";
import { DateTime } from "luxon";
import { PAYMENT_LINK_VERIFIED_COOKIE } from "./const";
import { PaymentLinksSettings, paymentLinksSettingsSchema } from "./models";
import { PaymentLinksTemplates } from "./templates";
import {
  PaymentLinksAdminAllKeys,
  PaymentLinksAdminKeys,
  PaymentLinksAdminNamespace,
  PaymentLinksPublicKeys,
  paymentLinksPublicNamespace,
} from "./translations/types";

const PAYMENTS_COLLECTION = "payments";

function normalizeEmail(value?: string | null): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || undefined;
}

function normalizePhone(value?: string | null): string | undefined {
  const digits = value?.replaceAll(/[^+0-9]/gi, "");
  return digits || undefined;
}

function verifiedCookieHeader(publicId: string): string {
  return `${PAYMENT_LINK_VERIFIED_COOKIE}=${encodeURIComponent(publicId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`;
}

export class PaymentLinksConnectedApp
  implements
    IConnectedApp,
    IPaymentLinkProvider,
    IPublicPageProvider,
    ICommunicationTemplatesProvider,
    IEventSubscriber
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "PaymentLinksConnectedApp",
      props.organizationId,
    );
  }

  public async getCommunicationTemplates(
    _appData: ConnectedAppData,
  ): Promise<TemplateTemplatesList> {
    return PaymentLinksTemplates;
  }

  public async getPublicPageClaims(
    _appData: ConnectedAppData,
  ): Promise<PublicPageClaim[]> {
    return [{ slug: "payment", noIndex: true }];
  }

  public async getPublicPageChrome(
    appData: ConnectedAppData,
    _ctx: PublicPageChromeContext,
  ): Promise<PublicPageChrome | undefined> {
    const settings = (appData.data ?? {}) as PaymentLinksSettings;

    return {
      headerId: settings.headerId,
      footerId: settings.footerId,
      title: "Payment",
    };
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: PaymentLinksSettings,
  ): Promise<
    ConnectedAppStatusWithText<
      PaymentLinksAdminNamespace,
      PaymentLinksAdminKeys
    >
  > {
    const logger = this.loggerFactory("processRequest");
    logger.debug({ appId: appData._id }, "Processing Payment Links setup");

    const { data, success, error } =
      paymentLinksSettingsSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid Payment Links settings");
      throw new ConnectedAppRequestError(
        "invalid_request",
        { request, error },
        400,
        error.message,
      );
    }

    try {
      const status: ConnectedAppStatusWithText<
        PaymentLinksAdminNamespace,
        PaymentLinksAdminKeys
      > = {
        status: "connected",
        statusText:
          "app_payment-links_admin.statusText.successfully_set_up" satisfies PaymentLinksAdminAllKeys,
      };

      await this.props.update({
        data,
        ...status,
      });

      logger.info({ appId: appData._id }, "Payment Links configured");
      return status;
    } catch (err) {
      logger.error(
        { appId: appData._id, error: err },
        "Error processing Payment Links configuration",
      );

      await this.props.update({
        status: "failed",
        statusText:
          "app_payment-links_admin.statusText.error_processing_configuration" satisfies PaymentLinksAdminAllKeys,
      });

      throw err;
    }
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug({ appId: appData._id }, "Installing Payment Links");

    try {
      const { configurationService, templatesService, pagesService } =
        this.props.services;
      const { language } = await configurationService.getConfiguration("brand");

      let emailTemplateId: string | undefined;
      let smsTemplateId: string | undefined;

      const getUniqueName = async (
        baseName: string,
      ): Promise<string | null> => {
        for (let i = 0; i < 10; i++) {
          const candidate = i === 0 ? baseName : `${baseName} (${i + 1})`;
          const isUnique = await templatesService.checkUniqueName(candidate);
          if (isUnique) {
            return candidate;
          }
        }

        logger.warn(
          { appId: appData._id, baseName },
          "Could not generate unique template name after 10 attempts",
        );
        return null;
      };

      for (const [id, templatesByLang] of Object.entries(
        PaymentLinksTemplates,
      )) {
        const source = templatesByLang[language] ?? templatesByLang.en;
        if (!source) {
          logger.warn(
            { appId: appData._id, id, language },
            "No source template found for language",
          );
          continue;
        }

        const uniqueName = await getUniqueName(source.name);
        if (!uniqueName) {
          continue;
        }

        const created = await templatesService.createTemplate(
          {
            ...source,
            name: uniqueName,
          },
          systemEventSource,
        );

        if (id === "payment-links-email") {
          emailTemplateId = created._id;
        } else if (id === "payment-links-sms") {
          smsTemplateId = created._id;
        }
      }

      const headers = await pagesService.getPageHeaders({ limit: 50 });
      const preferredHeader =
        headers.items.find(
          (item) => resolvePageHeaderPosition(item) !== "fixed",
        ) ?? headers.items[0];
      const footers = await pagesService.getPageFooters({ limit: 1 });
      const headerId = preferredHeader?._id;
      const footerId = footers.items[0]?._id;

      logger.debug(
        { appId: appData._id, headerId, footerId },
        "Using preferred page header and footer",
      );

      const currentSettings = (appData.data as PaymentLinksSettings) ?? {};
      const nextSettings: PaymentLinksSettings = {
        verification: currentSettings.verification ?? "none",
        emailTemplateId: emailTemplateId ?? currentSettings.emailTemplateId,
        smsTemplateId: smsTemplateId ?? currentSettings.smsTemplateId,
        headerId: currentSettings.headerId ?? headerId,
        footerId: currentSettings.footerId ?? footerId,
        linkExpiryDays: currentSettings.linkExpiryDays,
        tipsEnabled: currentSettings.tipsEnabled ?? false,
        tipPresets: currentSettings.tipPresets ?? [],
      };

      await this.props.update({
        data: nextSettings,
        status: "connected",
        statusText:
          "app_payment-links_admin.statusText.successfully_set_up" satisfies PaymentLinksAdminAllKeys,
      });

      logger.info(
        {
          appId: appData._id,
          emailTemplateId,
          smsTemplateId,
          headerId: nextSettings.headerId,
          footerId: nextSettings.footerId,
        },
        "Payment Links templates and chrome seeded",
      );
    } catch (error) {
      logger.error(
        { appId: appData._id, error },
        "Failed to seed Payment Links on install",
      );
      throw error;
    }

    logger.info({ appId: appData._id }, "Payment Links installed");
  }

  public async createPaymentLink(
    appData: ConnectedAppData,
    request: CreatePaymentLinkRequest,
  ): Promise<PaymentLinkResult> {
    const logger = this.loggerFactory("createPaymentLink");
    logger.debug(
      { appId: appData._id, paymentId: request.paymentId },
      "Creating payment link",
    );

    const payment = await this.props.services.paymentsService.getPayment(
      request.paymentId,
    );

    if (!payment || payment.method !== "payment-link") {
      logger.error(
        { paymentId: request.paymentId },
        "Payment not found for payment link",
      );

      throw new ConnectedAppRequestError(
        "payment_not_found",
        { paymentId: request.paymentId },
        404,
      );
    }

    const settings = (appData.data ?? {}) as PaymentLinksSettings;
    const publicId = payment.publicId || randomBytes(16).toString("hex");

    let expiresAt = request.expiresAt ?? payment.expiresAt;
    if (!expiresAt && settings.linkExpiryDays) {
      logger.debug(
        { paymentId: payment._id, settings },
        "Setting payment link expiry date",
      );

      expiresAt = DateTime.now()
        .plus({ days: settings.linkExpiryDays })
        .toJSDate();
    }

    if (publicId !== payment.publicId || expiresAt !== payment.expiresAt) {
      logger.debug(
        { paymentId: payment._id, publicId, expiresAt },
        "Updating payment link",
      );

      await this.props.services.paymentsService.updatePayment(
        payment._id,
        {
          publicId,
          expiresAt,
        } as Partial<PaymentLinkPayment>,
        systemEventSource,
      );
    }

    const organization =
      await this.props.services.organizationService.getOrganization();

    if (!organization) {
      logger.error({ appId: appData._id }, "Organization not found");

      throw new ConnectedAppRequestError(
        "organization_not_found",
        { appId: appData._id },
        500,
      );
    }

    const websiteUrl = getWebsiteUrl(organization);
    const result: PaymentLinkResult = {
      id: payment._id,
      url: `${websiteUrl}/payment?id=${publicId}`,
      hostedOn: "hacado",
      expiresAt,
    };

    logger.info(
      { appId: appData._id, paymentId: payment._id, publicId },
      "Payment link created",
    );

    return result;
  }

  public async sendPaymentLink(
    appData: ConnectedAppData,
    payment: Payment,
    request: SendPaymentLinkRequest,
  ): Promise<void> {
    const logger = this.loggerFactory("sendPaymentLink");
    logger.debug({ paymentId: payment._id, request }, "Sending payment link");

    if (payment.method !== "payment-link") {
      logger.error({ paymentId: payment._id }, "Invalid payment method");

      throw new ConnectedAppRequestError(
        "invalid_payment_method",
        { paymentId: payment._id },
        400,
      );
    }

    const settings = (appData.data ?? {}) as PaymentLinksSettings;
    const customer = await this.props.services.customersService.getCustomer(
      payment.customerId,
    );

    if (!customer) {
      throw new ConnectedAppRequestError(
        "customer_not_found",
        { customerId: payment.customerId },
        404,
      );
    }

    logger.debug(
      { paymentId: payment._id, customerId: payment.customerId },
      "Customer found",
    );

    const organization =
      await this.props.services.organizationService.getOrganization();

    if (!organization) {
      logger.error({ appId: appData._id }, "Organization not found");

      throw new ConnectedAppRequestError(
        "organization_not_found",
        { appId: appData._id },
        500,
      );
    }

    const websiteUrl = getWebsiteUrl(organization);
    const paymentLinkUrl = `${websiteUrl}/payment?id=${payment.publicId}`;

    const { brand, general, booking, social } =
      await this.props.services.configurationService.getConfigurations(
        "brand",
        "general",
        "booking",
        "social",
      );

    logger.debug(
      { paymentId: payment._id, appId: appData._id },
      "Configuration found",
    );

    const amountFormatted = formatAmountWithCurrency(
      payment.amount,
      brand.language,
      general.currency,
    );

    const tPublic = await getI18nAsync(paymentLinksPublicNamespace);
    const descriptionKey = payment.description as PaymentLinksPublicKeys;
    const description =
      payment.description && tPublic.has(descriptionKey)
        ? tPublic(descriptionKey)
        : payment.description;

    const args = getArguments({
      appointment: null,
      customer,
      config: { brand, general, booking, social },
      adminUrl: getAdminUrl(),
      websiteUrl,
      additionalProperties: {
        payment: {
          ...payment,
          amountFormatted,
          description,
        },
        paymentLinkUrl,
      },
    });

    logger.debug(
      { paymentId: payment._id, appId: appData._id },
      "Arguments built",
    );

    if (request.channel === "email") {
      logger.debug(
        {
          paymentId: payment._id,
          appId: appData._id,
          channel: request.channel,
        },
        "Sending email",
      );

      const templateId = settings.emailTemplateId;
      if (!templateId) {
        logger.error(
          { paymentId: payment._id, appId: appData._id },
          "Email template missing",
        );

        throw new ConnectedAppRequestError(
          "email_template_missing",
          { appId: appData._id },
          400,
        );
      }

      const emailTemplate =
        await this.props.services.templatesService.getTemplate(templateId);
      if (!emailTemplate || emailTemplate.type !== "email") {
        logger.error(
          { paymentId: payment._id, appId: appData._id, templateId },
          "Email template invalid",
        );

        throw new ConnectedAppRequestError(
          "email_template_invalid",
          { templateId },
          400,
        );
      }

      const subject = templateSafeWithError(emailTemplate.subject, args);
      const body = await renderToStaticMarkup({
        args,
        document: emailTemplate.value,
      });

      logger.debug(
        { paymentId: payment._id, appId: appData._id, subject },
        "Email content built",
      );

      await this.props.services.notificationService.sendEmail({
        email: {
          to: request.to,
          subject,
          body,
        },
        participantType: "customer",
        customerId: customer._id,
        handledBy: {
          key: "app_payment-links_admin.handlers.send-email" satisfies PaymentLinksAdminAllKeys,
          args: { name: customer.name },
        },
      });

      await this.props.services.paymentsService.updatePayment(
        payment._id,
        { sentToEmail: request.to } as Partial<PaymentLinkPayment>,
        systemEventSource,
      );

      logger.info(
        { paymentId: payment._id, to: request.to },
        "Payment link email sent",
      );

      return;
    }

    logger.debug(
      { paymentId: payment._id, appId: appData._id, channel: request.channel },
      "Sending SMS",
    );

    const templateId = settings.smsTemplateId;
    if (!templateId) {
      logger.error(
        { paymentId: payment._id, appId: appData._id },
        "SMS template missing",
      );

      throw new ConnectedAppRequestError(
        "sms_template_missing",
        { appId: appData._id },
        400,
      );
    }

    const smsTemplate =
      await this.props.services.templatesService.getTemplate(templateId);
    if (!smsTemplate || smsTemplate.type !== "text-message") {
      logger.error(
        { paymentId: payment._id, appId: appData._id, templateId },
        "SMS template invalid",
      );

      throw new ConnectedAppRequestError(
        "sms_template_invalid",
        { templateId },
        400,
      );
    }

    const body = templateSafeWithError(smsTemplate.value as string, args, true);

    await this.props.services.notificationService.sendTextMessage({
      phone: request.to,
      body,
      participantType: "customer",
      customerId: customer._id,
      handledBy: {
        key: "app_payment-links_admin.handlers.send-sms" satisfies PaymentLinksAdminAllKeys,
        args: { name: customer.name },
      },
    });

    await this.props.services.paymentsService.updatePayment(
      payment._id,
      { sentToPhone: request.to } as Partial<PaymentLinkPayment>,
      systemEventSource,
    );

    logger.info(
      { paymentId: payment._id, to: request.to },
      "Payment link SMS sent",
    );
  }

  public async cancelPaymentLink(
    _appData: ConnectedAppData,
    _payment: Payment,
  ): Promise<void> {
    // Caller updates payment status to cancelled.
  }

  public async onEvent(
    appData: ConnectedAppData,
    envelope: EventEnvelope,
  ): Promise<void> {
    const logger = this.loggerFactory("onEvent");
    logger.debug({ appId: appData._id, envelope }, "Handling event");

    if (envelope.type !== PAYMENT_INTENT_PAID_EVENT_TYPE) {
      logger.debug({ appId: appData._id, envelope }, "Skipping event");

      return;
    }

    const { intent } = envelope.payload as PaymentIntentPaidPayload;
    const request = intent.request as {
      source?: string;
      sourceId?: string;
      amount?: number;
      tipAmount?: number;
    };

    if (request.source !== "payment-link" || !request.sourceId) {
      logger.debug(
        { appId: appData._id, envelope },
        "Skipping event (not payment link)",
      );

      return;
    }

    logger.debug(
      {
        appId: appData._id,
        intentId: intent._id,
        sourceId: request.sourceId,
      },
      "Handling payment-intent.paid for payment link",
    );

    let payment =
      (await this.props.services.paymentsService.getPayment(
        request.sourceId,
      )) ?? null;

    if (!payment || payment.method !== "payment-link") {
      logger.debug(
        { sourceId: request.sourceId, intentId: intent._id },
        "Payment link payment not found, checking by intent id",
      );

      payment = await this.getPaymentByIntentId(intent._id);
    }

    if (!payment || payment.method !== "payment-link") {
      logger.warn(
        { sourceId: request.sourceId, intentId: intent._id },
        "Payment link payment not found for paid intent",
      );

      return;
    }

    if (payment.status !== "pending") {
      logger.debug(
        { paymentId: payment._id, status: payment.status },
        "Payment already settled, skipping",
      );

      return;
    }

    logger.debug(
      { paymentId: payment._id, intentId: intent._id },
      "Payment link payment found, updating status to paid",
    );

    const tipAmount =
      typeof request.tipAmount === "number" && request.tipAmount > 0
        ? request.tipAmount
        : undefined;
    const paidAmount =
      typeof intent.amount === "number" && intent.amount > 0
        ? intent.amount
        : payment.amount;

    await this.props.services.paymentsService.updatePayment(
      payment._id,
      {
        status: "paid",
        paidAt: intent.paidAt ?? new Date(),
        amount: paidAmount,
        tipAmount,
        intentId: intent._id,
        processorAppId: intent.appId,
        processorAppName: intent.appName,
        externalId: intent.externalId,
        fees: intent.fees,
      } as Partial<PaymentLinkPayment>,
      customerEventSource(payment.customerId),
    );

    await this.activateGiftCardForPaidPayment(payment._id);

    logger.info(
      { paymentId: payment._id, intentId: intent._id },
      "Payment link marked paid from intent",
    );
  }

  public async processAppCall(
    appData: ConnectedAppData,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse> {
    const action = slug.join("/");
    const logger = this.loggerFactory("processAppCall");
    logger.debug(
      { appId: appData._id, action, method: request.method },
      "Processing Payment Links app call",
    );

    if (request.method === "GET" && slug[0] === "public" && slug[1]) {
      return this.handlePublicLoad(appData, slug[1], request);
    }

    if (request.method === "POST" && action === "verify-contact") {
      return this.handleVerifyContact(appData, request);
    }

    if (request.method === "POST" && action === "intent") {
      return this.handleIntent(appData, request);
    }

    if (request.method === "POST" && action === "complete") {
      return this.handleComplete(appData, request);
    }

    logger.warn(
      { appId: appData._id, action, method: request.method },
      "Unknown action",
    );

    return Response.json(
      { success: false, error: "not_found" },
      { status: 404 },
    );
  }

  private async handlePublicLoad(
    appData: ConnectedAppData,
    publicId: string,
    request: ApiRequest,
  ): Promise<Response> {
    const logger = this.loggerFactory("handlePublicLoad");
    logger.debug({ appId: appData._id, publicId }, "Loading payment link");

    const payment = await this.getPaymentByPublicId(publicId);
    if (!payment) {
      logger.warn({ publicId }, "Payment not found by publicId");
      return Response.json(
        { success: false, code: "not_found" },
        { status: 404 },
      );
    }

    const settings = (appData.data ?? {}) as PaymentLinksSettings;
    const expired =
      !!payment.expiresAt && payment.expiresAt.getTime() < Date.now();
    const verification = settings.verification ?? "none";
    const verified = await this.isVerified(
      appData,
      payment,
      verification,
      request,
    );

    logger.debug({ appId: appData._id, publicId }, "Payment link loaded");

    const { brand, general } =
      await this.props.services.configurationService.getConfigurations(
        "brand",
        "general",
      );

    logger.debug({ appId: appData._id }, "Configuration loaded");

    return Response.json({
      success: true,
      payment: {
        publicId: payment.publicId,
        amount: payment.amount,
        amountFormatted: formatAmountWithCurrency(
          payment.amount,
          brand.language,
          general.currency,
        ),
        description: payment.description,
        type: payment.type,
        status:
          expired && payment.status === "pending" ? "expired" : payment.status,
        expiresAt: payment.expiresAt,
      },
      tips: {
        enabled: !!settings.tipsEnabled,
        presets: (settings.tipPresets ?? []).filter(
          (value) => typeof value === "number" && value > 0 && value <= 100,
        ),
      },
      verification,
      verified,
    });
  }

  private async handleVerifyContact(
    appData: ConnectedAppData,
    request: ApiRequest,
  ): Promise<Response> {
    const logger = this.loggerFactory("handleVerifyContact");
    logger.debug({ appId: appData._id }, "Verifying contact");

    const body = await request.json();
    const publicId =
      typeof body?.publicId === "string" ? body.publicId : undefined;
    const email = normalizeEmail(body?.email);
    const phone = normalizePhone(body?.phone);

    logger.debug(
      { appId: appData._id, publicId, email, phone },
      "Contact verification request received",
    );

    if (!publicId || (!email && !phone)) {
      logger.debug(
        { appId: appData._id, publicId, email, phone },
        "Invalid body",
      );
      return Response.json(
        { success: false, code: "invalid_body" },
        { status: 400 },
      );
    }

    const settings = (appData.data ?? {}) as PaymentLinksSettings;
    if ((settings.verification ?? "none") !== "contact-match") {
      logger.debug(
        { appId: appData._id, publicId, email, phone },
        "Verification not required",
      );
      return Response.json(
        { success: false, code: "verification_not_required" },
        { status: 400 },
      );
    }

    const payment = await this.getPaymentByPublicId(publicId);
    if (!payment) {
      logger.debug({ appId: appData._id, publicId }, "Payment link not found");
      return Response.json(
        { success: false, code: "not_found" },
        { status: 404 },
      );
    }

    logger.debug(
      { appId: appData._id, publicId, payment },
      "Payment link found",
    );
    const customer = await this.props.services.customersService.getCustomer(
      payment.customerId,
    );

    if (!customer) {
      logger.debug({ appId: appData._id, publicId }, "Customer not found");
      return Response.json(
        { success: false, code: "customer_not_found" },
        { status: 404 },
      );
    }

    logger.debug({ appId: appData._id, publicId, customer }, "Customer found");
    const emailMatch = !!email && normalizeEmail(customer.email) === email;
    const phoneMatch = !!phone && normalizePhone(customer.phone) === phone;

    logger.debug(
      { appId: appData._id, publicId, emailMatch, phoneMatch },
      "Contact match check",
    );

    if (!emailMatch && !phoneMatch) {
      logger.debug({ publicId }, "Contact match failed");
      return Response.json(
        { success: false, code: "mismatch" },
        { status: 403 },
      );
    }

    logger.debug({ appId: appData._id, publicId }, "Contact match successful");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": verifiedCookieHeader(publicId),
      },
    });
  }

  private async handleIntent(
    appData: ConnectedAppData,
    request: ApiRequest,
  ): Promise<Response> {
    const logger = this.loggerFactory("handleIntent");
    logger.debug({ appId: appData._id }, "Creating payment link intent");

    const body = await request.json();
    const publicId =
      typeof body?.publicId === "string" ? body.publicId : undefined;
    const tipAmountRaw =
      typeof body?.tipAmount === "number" ? body.tipAmount : 0;
    const tipAmount =
      Number.isFinite(tipAmountRaw) && tipAmountRaw > 0
        ? Math.round(tipAmountRaw * 100) / 100
        : 0;

    if (!publicId) {
      logger.debug({ appId: appData._id, publicId }, "Invalid body");
      return Response.json(
        { success: false, code: "invalid_body" },
        { status: 400 },
      );
    }

    const payment = await this.getPaymentByPublicId(publicId);
    if (!payment) {
      logger.debug({ appId: appData._id, publicId }, "Payment link not found");
      return Response.json(
        { success: false, code: "not_found" },
        { status: 404 },
      );
    }

    if (payment.status !== "pending") {
      logger.debug(
        { appId: appData._id, publicId, status: payment.status },
        "Payment link not pending",
      );
      return Response.json(
        { success: false, code: "not_payable", status: payment.status },
        { status: 400 },
      );
    }

    if (payment.expiresAt && payment.expiresAt.getTime() < Date.now()) {
      logger.debug({ appId: appData._id, publicId }, "Payment link expired");
      return Response.json(
        { success: false, code: "expired" },
        { status: 400 },
      );
    }

    logger.debug({ appId: appData._id, publicId }, "Payment link verified");

    const settings = (appData.data ?? {}) as PaymentLinksSettings;
    const verification = settings.verification ?? "none";
    const verified = await this.isVerified(
      appData,
      payment,
      verification,
      request,
    );

    if (!verified) {
      logger.warn({ appId: appData._id, publicId }, "Verification required");
      return Response.json(
        { success: false, code: "verification_required" },
        { status: 401 },
      );
    }

    const organization =
      await this.props.services.organizationService.getOrganization();
    const planTier = resolvePlanTierFromOrganization(organization);
    if (!canUseFeature(planTier, "payments")) {
      logger.warn(
        { appId: appData._id, publicId },
        "Subscription upgrade required",
      );
      return Response.json(
        { success: false, code: "subscription_upgrade_required" },
        { status: 402 },
      );
    }

    const { booking: config, defaultApps } =
      await this.props.services.configurationService.getConfigurations(
        "booking",
        "defaultApps",
      );

    const paymentAppId = defaultApps?.paymentAppId;
    if (!config.payments?.enabled || !paymentAppId) {
      logger.debug("Payments are not enabled");
      return Response.json(
        { success: false, code: "payments_not_enabled" },
        { status: 405 },
      );
    }

    const { app, service } =
      await this.props.services.connectedAppsService.getAppService<IPaymentProcessor>(
        paymentAppId,
      );

    const formProps = service.getFormProps(app);
    const tipsEnabled = !!settings.tipsEnabled;
    const baseAmount = payment.amount;
    const resolvedTipAmount = tipsEnabled ? tipAmount : 0;
    const chargeAmount =
      Math.round((baseAmount + resolvedTipAmount) * 100) / 100;

    const intentUpdate = {
      amount: chargeAmount,
      appId: app._id,
      appName: app.name,
      customerId: payment.customerId,
      appointmentId: payment.appointmentId,
      type: "purchase",
      request: {
        amount: baseAmount,
        tipAmount: resolvedTipAmount > 0 ? resolvedTipAmount : undefined,
        source: "payment-link",
        sourceId: payment._id,
      },
    } satisfies Omit<PaymentIntentUpdateModel, "status">;

    logger.debug(
      { appId: appData._id, publicId, intentUpdate },
      "Intent update built",
    );

    const intentResult = payment.intentId
      ? await this.props.services.paymentsService.updateIntent(
          payment.intentId,
          { ...intentUpdate, status: "created" },
        )
      : await this.props.services.paymentsService.createIntent(intentUpdate);

    logger.debug(
      {
        appId: appData._id,
        publicId,
        intentResult,
        isUpdate: !!payment.intentId,
      },
      "Intent updated or created",
    );

    if (!payment.intentId || payment.intentId !== intentResult._id) {
      logger.debug(
        { appId: appData._id, publicId, intentId: intentResult._id },
        "Updating payment intent id",
      );
      await this.props.services.paymentsService.updatePayment(
        payment._id,
        { intentId: intentResult._id } as Partial<PaymentLinkPayment>,
        systemEventSource,
      );
    }

    const { request: _, ...intent } = intentResult;

    logger.info(
      { paymentId: payment._id, intentId: intent._id },
      "Payment link intent created",
    );

    return Response.json({
      formProps,
      intent,
      amount: chargeAmount,
      amountPaid: 0,
      amountTotal: chargeAmount,
      isFixedAmount: true,
      tipAmount: resolvedTipAmount,
      baseAmount,
    } satisfies CollectPayment & {
      tipAmount: number;
      baseAmount: number;
    });
  }

  private async handleComplete(
    appData: ConnectedAppData,
    request: ApiRequest,
  ): Promise<Response> {
    const logger = this.loggerFactory("handleComplete");
    logger.debug({ appId: appData._id }, "Completing payment link");

    const body = await request.json();
    const publicId =
      typeof body?.publicId === "string" ? body.publicId : undefined;
    const intentId =
      typeof body?.intentId === "string" ? body.intentId : undefined;

    if (!publicId || !intentId) {
      logger.debug({ appId: appData._id, publicId, intentId }, "Invalid body");
      return Response.json(
        { success: false, code: "invalid_body" },
        { status: 400 },
      );
    }

    const payment = await this.getPaymentByPublicId(publicId);
    if (!payment) {
      logger.debug({ appId: appData._id, publicId }, "Payment link not found");
      return Response.json(
        { success: false, code: "not_found" },
        { status: 404 },
      );
    }

    const intent =
      await this.props.services.paymentsService.getIntent(intentId);
    if (!intent || intent.status !== "paid") {
      logger.debug(
        { appId: appData._id, publicId, intentId, intent },
        "Intent not paid",
      );
      return Response.json(
        { success: false, code: "intent_not_paid" },
        { status: 400 },
      );
    }

    if (payment.status === "pending") {
      logger.debug(
        { appId: appData._id, publicId, intentId },
        "Updating payment to paid",
      );

      const request = intent.request as {
        tipAmount?: number;
        amount?: number;
      };
      const tipAmount =
        typeof request.tipAmount === "number" && request.tipAmount > 0
          ? request.tipAmount
          : undefined;
      const paidAmount =
        typeof intent.amount === "number" && intent.amount > 0
          ? intent.amount
          : payment.amount;

      await this.props.services.paymentsService.updatePayment(
        payment._id,
        {
          status: "paid",
          paidAt: intent.paidAt ?? new Date(),
          amount: paidAmount,
          tipAmount,
          intentId: intent._id,
          processorAppId: intent.appId,
          processorAppName: intent.appName,
          externalId: intent.externalId,
          fees: intent.fees,
        } as Partial<PaymentLinkPayment>,
        customerEventSource(payment.customerId),
      );

      await this.activateGiftCardForPaidPayment(payment._id);

      logger.info(
        { appId: appData._id, paymentId: payment._id, intentId },
        "Payment link completed",
      );
    }

    return Response.json({ success: true });
  }

  private async isVerified(
    appData: ConnectedAppData,
    payment: PaymentLinkPayment,
    verification: PaymentLinksSettings["verification"],
    request: ApiRequest,
  ): Promise<boolean> {
    if (!verification || verification === "none") {
      return true;
    }

    if (verification === "contact-match") {
      const cookie = readCookieValue(
        request.headers.get("cookie"),
        PAYMENT_LINK_VERIFIED_COOKIE,
      );

      return cookie === payment.publicId;
    }

    const sessionToken = readCookieValue(
      request.headers.get("cookie"),
      CUSTOMER_SESSION_COOKIE,
    );
    const session =
      await this.props.services.customerAuthService.authorizeSession(
        sessionToken,
      );

    return (
      !!session &&
      session.organizationId === appData.organizationId &&
      session.customerId === payment.customerId
    );
  }

  private async getPaymentByPublicId(
    publicId: string,
  ): Promise<PaymentLinkPayment | null> {
    const db = await this.props.getDbConnection();
    const payment = await db.collection<Payment>(PAYMENTS_COLLECTION).findOne({
      organizationId: this.props.organizationId,
      method: "payment-link",
      publicId,
    });

    return (payment as PaymentLinkPayment | null) ?? null;
  }

  private async getPaymentByIntentId(
    intentId: string,
  ): Promise<PaymentLinkPayment | null> {
    const db = await this.props.getDbConnection();
    const payment = await db.collection<Payment>(PAYMENTS_COLLECTION).findOne({
      organizationId: this.props.organizationId,
      method: "payment-link",
      intentId,
    });

    return (payment as PaymentLinkPayment | null) ?? null;
  }

  private async activateGiftCardForPaidPayment(
    paymentId: string,
  ): Promise<void> {
    const logger = this.loggerFactory("activateGiftCardForPaidPayment");
    const giftCard =
      await this.props.services.giftCardsService.getGiftCardByPaymentId(
        paymentId,
      );

    if (!giftCard || giftCard.status === "active") {
      return;
    }

    logger.debug(
      { paymentId, giftCardId: giftCard._id },
      "Activating gift card after payment link paid",
    );

    await this.props.services.giftCardsService.setGiftCardStatus(
      giftCard._id,
      "active",
      systemEventSource,
    );
  }
}

export default PaymentLinksConnectedApp;
