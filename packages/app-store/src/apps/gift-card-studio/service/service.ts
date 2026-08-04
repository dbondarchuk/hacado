import { getLocale } from "@timelish/i18n/server";
import { getLoggerFactory, LoggerFactory } from "@timelish/logger";
import {
  AppJobRequest,
  CollectPayment,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppUninstallResult,
  DashboardNotification,
  DemoArguments,
  EventSource,
  ICommunicationTemplatesProvider,
  IConnectedApp,
  IConnectedAppProps,
  IDashboardNotifierApp,
  IDemoArgumentsProvider,
  IPaymentProcessor,
  IScheduled,
  PaymentIntentUpdateModel,
  SessionUser,
  systemEventSource,
  TemplateTemplatesList,
  memberEventSource,
} from "@timelish/types";
import { formatAmountWithCurrency } from "@timelish/utils";
import { DateTime } from "luxon";
import { DEFAULT_MAX_AMOUNT, DEFAULT_MIN_AMOUNT } from "../const";
import { demoPurchasedGiftCard } from "../demo-arguments";
import { renderGiftCard } from "../designer/lib/render/render";
import { FieldKeyValues } from "../designer/lib/types";
import {
  GIFT_CARD_STUDIO_DESIGN_CREATED_EVENT_TYPE,
  GIFT_CARD_STUDIO_DESIGN_DELETED_EVENT_TYPE,
  GIFT_CARD_STUDIO_DESIGN_UPDATED_EVENT_TYPE,
  GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE,
  GIFT_CARD_STUDIO_PURCHASE_DELETED_EVENT_TYPE,
} from "../events";
import type {
  CreatePurchasedGiftCardAction,
  DeleteDesignAction,
  DeleteDesignsAction,
  DeletePurchasedGiftCardAction,
  DesignModel,
  GiftCardStudioJobPayload,
  RegenerateGiftCardAssetsAction,
  ResendEmailAction,
  SetDesignArchivedAction,
  SetDesignsArchivedAction,
} from "../models";
import {
  CheckDesignNameUniqueActionType,
  CreateDesignActionType,
  CreatePurchasedGiftCardActionType,
  DeleteDesignActionType,
  DeleteDesignsActionType,
  DeletePurchasedGiftCardActionType,
  GetDesignByIdActionType,
  GetDesignsActionType,
  GetPreviewActionType,
  GetPurchasedGiftCardByIdActionType,
  GetPurchasedGiftCardsActionType,
  GetSettingsActionType,
  MarkGiftCardStudioPurchasesReadActionType,
  PurchasedGiftCardModel,
  RegenerateGiftCardAssetsActionType,
  RequestAction,
  requestActionSchema,
  ResendEmailActionType,
  SetDesignArchivedActionType,
  SetDesignsArchivedActionType,
  UpdateDesignActionType,
  UpdateSettingsActionType,
} from "../models";
import {
  fetchPreviewPayloadSchema,
  FetchPreviewResponse,
  GetInitOptionsResponse,
  intentRequestSchema,
  purchaseRequestSchema,
} from "../models/public";
import { GiftCardStudioSettings } from "../models/settings";
import { GiftCardStudioTemplates } from "../templates";
import { GiftCardStudioAdminAllKeys } from "../translations/types";
import { GiftCardStudioJobProcessor } from "./job-processor";
import { GiftCardStudioRepositoryService } from "./repository-service";
import {
  getGiftCardStudioUnreadPurchasesBadges,
  markGiftCardStudioPurchasesRead,
} from "./unread-purchases-badge";
import { getFileName } from "./utils";

const generateGiftCardCode = () => {
  return (
    Math.random().toString(36).substring(2, 5).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 5).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 5).toUpperCase()
  );
};

export class GiftCardStudioConnectedApp
  implements
    IConnectedApp,
    IScheduled,
    IDemoArgumentsProvider,
    ICommunicationTemplatesProvider,
    IDashboardNotifierApp
{
  protected readonly loggerFactory: LoggerFactory;

  public async getDemoEmailArguments(): Promise<DemoArguments> {
    return { giftCard: demoPurchasedGiftCard };
  }

  public async getCommunicationTemplates(): Promise<TemplateTemplatesList> {
    return GiftCardStudioTemplates;
  }

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "GiftCardStudioConnectedApp",
      props.organizationId,
    );
  }

  public async getInitialNotifications(
    appData: ConnectedAppData,
    memberId: string,
    _date?: Date,
  ): Promise<DashboardNotification[]> {
    const badges = await getGiftCardStudioUnreadPurchasesBadges(
      appData._id,
      appData.organizationId,
      memberId,
      this.props.getDbConnection,
      this.props.services,
    );

    return [
      {
        type: "gift-card-studio-unread-purchases",
        badges,
      },
    ];
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: RequestAction,
    _request?: unknown,
    user?: SessionUser,
  ): Promise<unknown> {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id, type: request.type },
      "Processing Gift Card Studio request",
    );

    const memberId = user?.memberId;
    const parsed = requestActionSchema.safeParse(request);
    if (!parsed.success) {
      logger.error({ error: parsed.error }, "Invalid request");
      throw new ConnectedAppRequestError(
        "invalid_gift_card_studio_request",
        { request },
        400,
        parsed.error.message,
      );
    }
    const data = parsed.data;

    const repo = this.getRepositoryService(appData._id, appData.organizationId);

    switch (data.type) {
      case CreateDesignActionType:
        logger.debug({ designName: data.design?.name }, "Create design");
        return this.processCreateDesign(appData, data, repo, memberId);
      case UpdateDesignActionType:
        logger.debug(
          { id: data.id, designName: data.design?.name },
          "Update design",
        );
        return this.processUpdateDesign(appData, data, repo, memberId);
      case DeleteDesignActionType:
        logger.debug({ id: data.id }, "Delete design");
        return this.processDeleteDesign(appData, data, repo, memberId);
      case DeleteDesignsActionType:
        logger.debug({ ids: data.ids }, "Delete designs");
        return this.processDeleteDesigns(appData, data, repo, memberId);
      case SetDesignArchivedActionType:
        logger.debug(
          { id: data.id, isArchived: data.isArchived },
          "Set design public",
        );
        return this.processSetDesignArchived(appData, data, repo, memberId);
      case SetDesignsArchivedActionType:
        logger.debug(
          { ids: data.ids, isArchived: data.isArchived },
          "Set designs archived",
        );
        return this.processSetDesignsArchived(appData, data, repo, memberId);
      case GetDesignsActionType:
        logger.debug("Get designs");
        return repo.getDesigns(data.query);
      case GetDesignByIdActionType:
        logger.debug({ id: data.id }, "Get design by id");
        return repo.getDesignById(data.id);
      case CheckDesignNameUniqueActionType:
        logger.debug(
          { name: data.name, excludeId: data.id },
          "Check design name unique",
        );
        return repo.checkDesignNameUnique(data.name, data.id);
      case GetPurchasedGiftCardsActionType:
        logger.debug("Get purchased gift cards");
        return repo.getPurchasedGiftCards(data.query);
      case GetPurchasedGiftCardByIdActionType:
        logger.debug({ id: data.id }, "Get purchased gift card by id");
        return repo.getPurchasedGiftCardById(data.id);
      case CreatePurchasedGiftCardActionType:
        logger.debug(
          {
            designId: data.purchase?.designId,
            amount: data.purchase?.amountPurchased,
          },
          "Create purchased gift card",
        );
        return this.processCreatePurchasedGiftCard(
          appData,
          data,
          repo,
          memberId,
        );
      case RegenerateGiftCardAssetsActionType:
        logger.debug(
          {
            id: data.id,
            assetType: data.assetType,
          },
          "Regenerate gift card assets",
        );
        return this.processRegenerateGiftCardAssets(
          appData,
          data as RegenerateGiftCardAssetsAction,
        );
      case GetPreviewActionType:
        logger.debug({ designId: data.designId }, "Get preview");
        return this.processGetPreview(appData, data, repo);
      case GetSettingsActionType:
        logger.debug("Get settings");
        return (appData.data as GiftCardStudioSettings) ?? {};
      case UpdateSettingsActionType:
        logger.debug("Update settings");
        return this.processUpdateSettings(appData, data);
      case DeletePurchasedGiftCardActionType:
        logger.debug({ id: data.id }, "Delete purchased gift card");
        return this.processDeletePurchasedGiftCard(
          appData,
          data,
          repo,
          memberId,
        );
      case MarkGiftCardStudioPurchasesReadActionType:
        return this.processMarkPurchasesReadRequest(appData, memberId);
      case ResendEmailActionType:
        logger.debug(
          { id: data.id, participantType: data.participantType },
          "Resend email to customer",
        );
        return this.processResendEmail(appData, data, repo);
      default:
        logger.warn({ type: (data as any).type }, "Unknown request type");
        return null;
    }
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug({ appId: appData._id }, "Installing Gift Card Studio");

    const repo = this.getRepositoryService(appData._id, appData.organizationId);
    await repo.install();
    logger.debug(
      { appId: appData._id },
      "Creating Gift Card Studio communication templates",
    );

    try {
      const { configurationService, templatesService } = this.props.services;

      const { language } = await configurationService.getConfiguration("brand");

      let purchaserTemplateId: string | undefined;
      let recipientTemplateId: string | undefined;

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
        GiftCardStudioTemplates,
      )) {
        const source = templatesByLang[language] ?? templatesByLang.en;
        if (!source) {
          logger.warn(
            { appId: appData._id, id, language },
            "No source template found for language",
          );
          continue;
        }

        logger.debug(
          { appId: appData._id, id, language, name: source.name },
          "Creating Gift Card Studio template",
        );

        const uniqueName = await getUniqueName(source.name);
        if (!uniqueName) {
          continue;
        }

        logger.debug(
          { appId: appData._id, id, language, name: uniqueName },
          "Unique name generated for Gift Card Studio template",
        );

        const created = await templatesService.createTemplate(
          {
            ...source,
            name: uniqueName,
          },
          systemEventSource,
        );

        logger.debug(
          {
            appId: appData._id,
            templateId: created._id,
            templateName: created.name,
          },
          "Created Gift Card Studio template",
        );

        if (id === "gift-card-studio-customer-email") {
          purchaserTemplateId = created._id;
        } else if (id === "gift-card-studio-recipient-email") {
          recipientTemplateId = created._id;
        }
      }

      const currentSettings = (appData.data as GiftCardStudioSettings) ?? {};

      logger.debug(
        { appId: appData._id, purchaserTemplateId, recipientTemplateId },
        "Updating Gift Card Studio settings",
      );

      const nextSettings: GiftCardStudioSettings = {
        notifyOwnerOnPurchase: currentSettings.notifyOwnerOnPurchase ?? false,
        emailTemplateIdToPurchaser:
          purchaserTemplateId ?? currentSettings.emailTemplateIdToPurchaser,
        emailTemplateIdToRecipient:
          recipientTemplateId ?? currentSettings.emailTemplateIdToRecipient,
        expirationMonths: currentSettings.expirationMonths ?? 12,
        minAmount: currentSettings.minAmount ?? DEFAULT_MIN_AMOUNT,
        maxAmount: currentSettings.maxAmount ?? DEFAULT_MAX_AMOUNT,
      };

      await this.props.update({
        data: nextSettings,
      });

      logger.info(
        {
          appId: appData._id,
          purchaserTemplateId,
          recipientTemplateId,
        },
        "Gift Card Studio settings updated with default templates",
      );
    } catch (error) {
      logger.error(
        { appId: appData._id, error },
        "Failed to create Gift Card Studio communication templates on install",
      );
    }

    logger.info({ appId: appData._id }, "Gift Card Studio installed");
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.debug({ appId: appData._id }, "Uninstalling Gift Card Studio");

    const repo = this.getRepositoryService(appData._id, appData.organizationId);
    const hasPurchases = await repo.hasPurchases();
    if (hasPurchases) {
      logger.warn(
        { appId: appData._id },
        "Cannot uninstall Gift Card Studio: purchases exist",
      );

      return {
        success: false,
        code: "cannot_uninstall_gift_card_has_purchases",
        error: {
          key: "app_gift-card-studio_admin.app.uninstallError.has_purchases" satisfies GiftCardStudioAdminAllKeys,
        },
      };
    }

    await repo.unInstall();
    logger.info({ appId: appData._id }, "Gift Card Studio uninstalled");
    return { success: true, code: "ok" };
  }

  public async processAppCall(
    appData: ConnectedAppData,
    slug: string[],
    request: Request,
  ): Promise<Response> {
    const logger = this.loggerFactory("processAppCall");
    logger.debug({ appId: appData._id, slug }, "Processing app call");

    if (slug[0] === "preview" && request.method === "POST") {
      return this.handlePreviewRequest(appData, request);
    }

    if (slug[0] === "intent" && request.method === "POST") {
      return this.handleIntentRequest(appData, request);
    }

    if (slug[0] === "purchase" && request.method === "POST") {
      return this.handlePurchaseRequest(appData, request);
    }

    if (slug[0] === "init-options" && request.method === "GET") {
      logger.debug("Getting init options");
      const designs = await this.getRepositoryService(
        appData._id,
        appData.organizationId,
      ).getDesigns({
        limit: undefined,
        sort: [{ id: "createdAt", desc: true }],
        isArchived: [false],
      });

      const settings = (appData.data as GiftCardStudioSettings) ?? {};
      const response: GetInitOptionsResponse = {
        designs: designs.items.map((design) => ({
          _id: design._id,
          name: design.name,
        })),
        amountLimits: {
          minAmount: settings.minAmount ?? DEFAULT_MIN_AMOUNT,
          maxAmount: settings.maxAmount ?? DEFAULT_MAX_AMOUNT,
        },
      };

      logger.debug(
        { designs: designs.items.length, amountLimits: response.amountLimits },
        "Init options got",
      );
      return Response.json(response);
    }

    return Response.json(
      { success: false, code: "not_found", error: "Not found" },
      { status: 404 },
    );
  }

  public async processJob(
    appData: ConnectedAppData,
    jobData: AppJobRequest<GiftCardStudioJobPayload>,
  ): Promise<void> {
    const logger = this.loggerFactory("processJob");
    logger.debug(
      { appId: appData._id, jobData },
      "Processing Gift Card Studio job",
    );

    const repo = this.getRepositoryService(appData._id, appData.organizationId);
    const jobProcessor = new GiftCardStudioJobProcessor(
      appData.organizationId,
      this.props.services,
      repo,
    );
    await jobProcessor.processJob(appData, jobData);

    logger.info(
      { appId: appData._id, jobData },
      "Successfully processed Gift Card Studio job",
    );
  }

  private getRepositoryService(appId: string, organizationId: string) {
    return new GiftCardStudioRepositoryService(
      appId,
      organizationId,
      this.props.getDbConnection,
      this.props.services,
    );
  }

  private adminEventSource(memberId?: string): EventSource {
    return memberId
      ? memberEventSource(memberId)
      : { actor: "member" };
  }

  private async emitGiftCardStudioEvent(
    type: string,
    payload: unknown,
    source: EventSource,
  ) {
    const logger = this.loggerFactory("emitGiftCardStudioEvent");
    try {
      await this.props.services.eventService.emit(type, payload, source);
    } catch (error: unknown) {
      logger.error(
        {
          type,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to emit gift card studio event",
      );
    }
  }

  private async emitPurchaseCreated(
    appData: ConnectedAppData,
    purchased: PurchasedGiftCardModel,
    designName: string,
    details: {
      giftCardCode: string;
      customerName?: string;
      customerEmail?: string;
    },
    source: EventSource,
  ) {
    await this.emitGiftCardStudioEvent(
      GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE,
      {
        appId: appData._id,
        purchase: {
          _id: purchased._id,
          designId: purchased.designId,
          designName,
          amountPurchased: purchased.amountPurchased,
          giftCardCode: details.giftCardCode,
          customerName: details.customerName,
          customerEmail: details.customerEmail,
          recipientName: purchased.toName,
          recipientEmail: purchased.toEmail,
        },
      },
      source,
    );
  }

  private async processMarkPurchasesReadRequest(
    appData: ConnectedAppData,
    memberId?: string,
  ) {
    if (!memberId) {
      throw new ConnectedAppRequestError(
        "invalid_gift_card_studio_request",
        { appId: appData._id },
        400,
        "Missing user context",
      );
    }

    await markGiftCardStudioPurchasesRead(
      appData.organizationId,
      appData._id,
      memberId,
      this.props.services,
    );

    return { success: true };
  }

  private async processCreateDesign(
    appData: ConnectedAppData,
    data: { design: any },
    repo: GiftCardStudioRepositoryService,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processCreateDesign");
    const isUnique = await repo.checkDesignNameUnique(data.design.name);
    if (!isUnique) {
      logger.warn({ name: data.design.name }, "Design name not unique");
      throw new ConnectedAppRequestError(
        "design_name_not_unique",
        { name: data.design.name },
        400,
        "Design name not unique",
      );
    }
    const created = await repo.createDesign(data.design);
    logger.info(
      { designId: (created as { _id: string })?._id, name: data.design.name },
      "Design created",
    );
    await this.emitGiftCardStudioEvent(
      GIFT_CARD_STUDIO_DESIGN_CREATED_EVENT_TYPE,
      {
        appId: appData._id,
        design: { _id: created._id, name: created.name },
      },
      this.adminEventSource(memberId),
    );
    return created;
  }

  private async processUpdateDesign(
    appData: ConnectedAppData,
    data: { id: string; design: any },
    repo: GiftCardStudioRepositoryService,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processUpdateDesign");
    const isUnique = await repo.checkDesignNameUnique(
      data.design.name,
      data.id,
    );
    if (!isUnique) {
      logger.warn(
        { name: data.design.name, id: data.id },
        "Design name not unique",
      );
      throw new ConnectedAppRequestError(
        "design_name_not_unique",
        { name: data.design.name, id: data.id },
        400,
        "Design name not unique",
      );
    }
    const updated = await repo.updateDesign(data.id, data.design);
    if (!updated) {
      logger.warn({ id: data.id }, "Design not found for update");
      throw new ConnectedAppRequestError(
        "design_not_found",
        { id: data.id },
        404,
        "Design not found",
      );
    }
    logger.info({ id: data.id, name: data.design.name }, "Design updated");
    await this.emitGiftCardStudioEvent(
      GIFT_CARD_STUDIO_DESIGN_UPDATED_EVENT_TYPE,
      {
        appId: appData._id,
        design: { _id: updated._id, name: updated.name },
      },
      this.adminEventSource(memberId),
    );
    return updated;
  }

  private async processDeleteDesign(
    appData: ConnectedAppData,
    data: DeleteDesignAction,
    repo: GiftCardStudioRepositoryService,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processDeleteDesign");
    const existing = await repo.getDesignById(data.id);
    const deleted = await repo.deleteDesign(data.id);
    if (!deleted) {
      logger.warn({ id: data.id }, "Design not found or has purchases");
      throw new ConnectedAppRequestError(
        "design_not_found_or_has_purchases",
        { id: data.id },
        404,
        "Design not found or has purchases",
      );
    }
    logger.info({ id: data.id }, "Design deleted");
    await this.emitGiftCardStudioEvent(
      GIFT_CARD_STUDIO_DESIGN_DELETED_EVENT_TYPE,
      {
        appId: appData._id,
        designId: data.id,
        designName: existing?.name,
      },
      this.adminEventSource(memberId),
    );
    return deleted;
  }

  private async processDeleteDesigns(
    appData: ConnectedAppData,
    data: DeleteDesignsAction,
    repo: GiftCardStudioRepositoryService,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processDeleteDesigns");
    const designs = await Promise.all(
      data.ids.map((id) => repo.getDesignById(id)),
    );
    const deleted = await repo.deleteDesigns(data.ids);
    if (!deleted) {
      logger.warn({ ids: data.ids }, "Designs not found or have purchases");
      throw new ConnectedAppRequestError(
        "designs_not_found_or_have_purchases",
        { ids: data.ids },
        404,
        "Designs not found or have purchases",
      );
    }

    logger.info({ ids: data.ids }, "Designs deleted");
    const source = this.adminEventSource(memberId);
    for (const design of designs) {
      if (!design) continue;
      await this.emitGiftCardStudioEvent(
        GIFT_CARD_STUDIO_DESIGN_DELETED_EVENT_TYPE,
        {
          appId: appData._id,
          designId: design._id,
          designName: design.name,
        },
        source,
      );
    }
    return deleted;
  }

  private async processSetDesignArchived(
    appData: ConnectedAppData,
    data: SetDesignArchivedAction,
    repo: GiftCardStudioRepositoryService,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processSetDesignArchived");
    const ok = await repo.setDesignArchived(data.id, data.isArchived);
    if (!ok) {
      logger.warn({ id: data.id }, "Design not found for set public");
      throw new ConnectedAppRequestError(
        "design_not_found",
        { id: data.id },
        404,
        "Design not found",
      );
    }
    const updated = await repo.getDesignById(data.id);
    if (updated) {
      await this.emitGiftCardStudioEvent(
        GIFT_CARD_STUDIO_DESIGN_UPDATED_EVENT_TYPE,
        {
          appId: appData._id,
          design: { _id: updated._id, name: updated.name },
        },
        this.adminEventSource(memberId),
      );
    }
    logger.info(
      { id: data.id, isArchived: data.isArchived },
      "Design visibility updated",
    );
    return ok;
  }

  private async processSetDesignsArchived(
    appData: ConnectedAppData,
    data: SetDesignsArchivedAction,
    repo: GiftCardStudioRepositoryService,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processSetDesignsArchived");
    const ok = await repo.setDesignsArchived(data.ids, data.isArchived);
    if (!ok) {
      logger.warn({ ids: data.ids }, "Designs not found for set public");
      throw new ConnectedAppRequestError(
        "designs_not_found",
        { ids: data.ids },
        404,
        "Designs not found",
      );
    }
    const source = this.adminEventSource(memberId);
    for (const id of data.ids) {
      const updated = await repo.getDesignById(id);
      if (!updated) continue;
      await this.emitGiftCardStudioEvent(
        GIFT_CARD_STUDIO_DESIGN_UPDATED_EVENT_TYPE,
        {
          appId: appData._id,
          design: { _id: updated._id, name: updated.name },
        },
        source,
      );
    }
    logger.info(
      { ids: data.ids, isArchived: data.isArchived },
      "Designs archived updated",
    );
    return ok;
  }

  private async processCreatePurchasedGiftCard(
    appData: ConnectedAppData,
    { purchase }: CreatePurchasedGiftCardAction,
    repo: GiftCardStudioRepositoryService,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processCreatePurchasedGiftCard");
    const settings = (appData.data as GiftCardStudioSettings) ?? {};
    const minAmount = settings.minAmount ?? DEFAULT_MIN_AMOUNT;
    const maxAmount = settings.maxAmount ?? DEFAULT_MAX_AMOUNT;
    if (purchase.amountPurchased < minAmount) {
      throw new ConnectedAppRequestError(
        "amount_purchased_too_low",
        { amount: purchase.amountPurchased },
        400,
        "Amount purchased is too low",
      );
    }
    if (purchase.amountPurchased > maxAmount) {
      throw new ConnectedAppRequestError(
        "amount_purchased_too_high",
        { amount: purchase.amountPurchased },
        400,
        "Amount purchased is too high",
      );
    }

    logger.debug({ purchase }, "Creating purchased gift card");

    const code = await this.generateUniqueGiftCardCode();
    const paidAt = new Date();

    const customerSource = {
      actor: "customer" as const,
      actorId: purchase.customerId,
    };

    const payment = await this.props.services.paymentsService.createPayment(
      {
        amount: purchase.amountPurchased,
        status: "paid",
        paidAt,
        customerId: purchase.customerId,
        description: "giftCard",
        type: "payment",
        method: purchase.paymentType,
      },
      customerSource,
    );

    logger.debug(
      {
        paymentId: payment._id,
        method: purchase.paymentType,
        amount: purchase.amountPurchased,
      },
      "Payment created",
    );

    const giftCard = await this.props.services.giftCardsService.createGiftCard(
      {
        code,
        amount: purchase.amountPurchased,
        customerId: purchase.customerId,
        paymentId: payment._id,
        expiresAt: DateTime.now()
          .plus({ months: settings.expirationMonths ?? 12 })
          .endOf("day")
          .toJSDate(),
        source: {
          appName: appData.name,
          appId: appData._id,
        },
      },
      customerSource,
    );

    logger.debug(
      { giftCardId: giftCard._id, code, amount: purchase.amountPurchased },
      "Gift card created",
    );

    const design = await repo.getDesignById(purchase.designId);
    const customer = await this.props.services.customersService.getCustomer(
      purchase.customerId,
    );

    const purchased = await repo.createPurchasedGiftCard({
      designId: purchase.designId,
      giftCardId: giftCard._id,
      amountPurchased: purchase.amountPurchased,
      customerId: purchase.customerId,
      toName: purchase.toName,
      toEmail: purchase.toEmail || undefined,
      message: purchase.message,
      cardGenerationStatus: "pending",
      invoiceGenerationStatus: "pending",
      recipientDeliveryStatus: "pending",
      customerDeliveryStatus: "pending",
      purchaseChannel: "admin",
    });

    logger.debug(
      { purchasedId: purchased._id, code, amount: purchase.amountPurchased },
      "Purchased gift card created",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "generate-gift-card",
        purchasedGiftCardId: purchased._id,
        sendEmails: {
          recipient: purchase.sendRecipientEmail ?? false,
          customer: purchase.sendCustomerEmail ?? false,
        },
      } satisfies GiftCardStudioJobPayload,
    });

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "generate-invoice",
        purchasedGiftCardId: purchased._id,
        sendEmails: {
          recipient: purchase.sendRecipientEmail ?? false,
          customer: purchase.sendCustomerEmail ?? false,
        },
      } satisfies GiftCardStudioJobPayload,
    });

    logger.debug(
      {
        purchasedId: purchased._id,
        code,
        amount: purchase.amountPurchased,
        sendEmails: {
          recipient: purchase.sendRecipientEmail ?? false,
          customer: purchase.sendCustomerEmail ?? false,
        },
      },
      "Successfully scheduled generate gift card job",
    );

    await this.emitPurchaseCreated(
      appData,
      purchased,
      design?.name ?? "",
      {
        giftCardCode: code,
        customerName: customer?.name,
        customerEmail: customer?.email,
      },
      this.adminEventSource(memberId),
    );

    logger.info(
      {
        purchasedId: purchased._id,
        designId: purchase.designId,
        amount: purchase.amountPurchased,
      },
      "Purchased gift card created",
    );
    return repo.getPurchasedGiftCardById(purchased._id);
  }

  private async processDeletePurchasedGiftCard(
    appData: ConnectedAppData,
    data: DeletePurchasedGiftCardAction,
    repo: GiftCardStudioRepositoryService,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processDeletePurchasedGiftCard");
    const deleted = await repo.deletePurchasedGiftCard(data.id);
    if (!deleted) {
      logger.warn(
        { id: data.id },
        "Purchased gift card not found or not allowed to be deleted",
      );
      throw new ConnectedAppRequestError(
        "purchased_gift_card_not_found",
        { id: data.id },
        405,
        "Purchased gift card not found",
      );
    }

    logger.info(
      { id: data.id },
      "Purchased gift card deleted, cleaning up related assets",
    );

    if (
      await this.props.services.assetsStorage.checkExists(
        getFileName(appData._id, data.id, "gift-card", "png"),
      )
    ) {
      logger.debug(
        { fileName: getFileName(appData._id, data.id, "gift-card", "png") },
        "Deleting gift card PNG",
      );
      await this.props.services.assetsStorage.deleteFile(
        getFileName(appData._id, data.id, "gift-card", "png"),
      );
    }
    if (
      await this.props.services.assetsStorage.checkExists(
        getFileName(appData._id, data.id, "gift-card", "pdf"),
      )
    ) {
      logger.debug(
        { fileName: getFileName(appData._id, data.id, "gift-card", "pdf") },
        "Deleting gift card PDF",
      );
      await this.props.services.assetsStorage.deleteFile(
        getFileName(appData._id, data.id, "gift-card", "pdf"),
      );
    }
    if (
      await this.props.services.assetsStorage.checkExists(
        getFileName(appData._id, data.id, "invoice", "pdf"),
      )
    ) {
      logger.debug(
        { fileName: getFileName(appData._id, data.id, "invoice", "pdf") },
        "Deleting invoice PDF",
      );
      await this.props.services.assetsStorage.deleteFile(
        getFileName(appData._id, data.id, "invoice", "pdf"),
      );
    }

    logger.info({ id: data.id }, "Related assets cleaned up");
    await this.emitGiftCardStudioEvent(
      GIFT_CARD_STUDIO_PURCHASE_DELETED_EVENT_TYPE,
      {
        appId: appData._id,
        purchaseId: data.id,
      },
      this.adminEventSource(memberId),
    );
    return deleted;
  }

  private async processRegenerateGiftCardAssets(
    appData: ConnectedAppData,
    data: RegenerateGiftCardAssetsAction,
  ) {
    const logger = this.loggerFactory("processRegenerateGiftCardAssets");
    logger.debug(
      {
        appId: appData._id,
        purchasedGiftCardId: data.id,
        assetType: data.assetType,
      },
      "Scheduling regeneration of gift card assets",
    );

    const payload: GiftCardStudioJobPayload =
      data.assetType === "gift-card"
        ? {
            type: "generate-gift-card",
            purchasedGiftCardId: data.id,
          }
        : {
            type: "generate-invoice",
            purchasedGiftCardId: data.id,
          };

    const repo = this.getRepositoryService(appData._id, appData.organizationId);
    const purchased = await repo.getPurchasedGiftCardById(data.id);
    if (!purchased) {
      logger.warn({ purchasedId: data.id }, "Purchased gift card not found");
      throw new ConnectedAppRequestError(
        "purchased_gift_card_not_found",
        { purchasedId: data.id },
        404,
        "Purchased gift card not found",
      );
    }

    if (data.assetType === "gift-card") {
      await repo.updatePurchasedGiftCardStatus(data.id, {
        cardGenerationStatus: "pending",
      });
    } else {
      await repo.updatePurchasedGiftCardStatus(data.id, {
        invoiceGenerationStatus: "pending",
      });
    }

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload,
    });

    logger.info(
      {
        appId: appData._id,
        purchasedGiftCardId: data.id,
        assetType: data.assetType,
      },
      "Scheduled regeneration of gift card assets",
    );
  }

  private async processResendEmail(
    appData: ConnectedAppData,
    { id, participantType }: ResendEmailAction,
    repo: GiftCardStudioRepositoryService,
  ) {
    const logger = this.loggerFactory("processResendEmail");

    logger.debug({ id, participantType }, `Resend email to ${participantType}`);

    const purchased = await repo.getPurchasedGiftCardById(id);
    if (!purchased) {
      logger.warn({ id }, "Purchased gift card not found");
      throw new ConnectedAppRequestError(
        "purchased_gift_card_not_found",
        { id },
        404,
        "Purchased gift card not found",
      );
    }

    const jobProcessor = new GiftCardStudioJobProcessor(
      appData.organizationId,
      this.props.services,
      repo,
    );
    if (participantType === "customer") {
      if (purchased.invoiceGenerationStatus !== "completed") {
        logger.warn({ id, participantType }, "Invoice not generated yet");
        throw new ConnectedAppRequestError(
          "invoice_not_generated",
          { id, participantType },
          400,
          "Invoice not generated yet",
        );
      }

      if (purchased.cardGenerationStatus !== "completed") {
        logger.warn({ id, participantType }, "Gift card not generated yet");
        throw new ConnectedAppRequestError(
          "gift_card_not_generated",
          { id, participantType },
          400,
          "Gift card not generated yet",
        );
      }

      await repo.updatePurchasedGiftCardStatus(id, {
        customerDeliveryStatus: "scheduled",
      });

      await jobProcessor.sendEmailToCustomer(appData, purchased);
    } else {
      if (purchased.cardGenerationStatus !== "completed") {
        logger.warn({ id, participantType }, "Gift card not generated yet");
        throw new ConnectedAppRequestError(
          "gift_card_not_generated",
          { id, participantType },
          400,
          "Gift card not generated yet",
        );
      }

      await repo.updatePurchasedGiftCardStatus(id, {
        recipientDeliveryStatus: "scheduled",
      });

      await jobProcessor.sendEmailToRecipient(appData, purchased);
    }

    logger.info({ id, participantType }, "Successfully resend email");
    return true;
  }

  private async generateUniqueGiftCardCode(): Promise<string> {
    const logger = this.loggerFactory("generateUniqueGiftCardCode");
    for (let i = 0; i < 50; i++) {
      const code = generateGiftCardCode();
      const unique =
        await this.props.services.giftCardsService.checkGiftCardCodeUnique(
          code,
        );
      if (unique) return code;
    }
    logger.error("Could not generate unique gift card code after 50 attempts");
    throw new Error("Could not generate unique gift card code");
  }

  private async processGetPreview(
    appData: ConnectedAppData,
    data: {
      designId: string;
      amount: number;
      name?: string;
      email?: string;
      phone?: string;
      toName?: string;
      toEmail?: string;
      message?: string;
    },
    repo: GiftCardStudioRepositoryService,
  ): Promise<{ success: true; imageDataUrl: string }> {
    const design = await repo.getDesignById(data.designId);
    if (!design) {
      throw new ConnectedAppRequestError(
        "design_not_found",
        { id: data.designId },
        404,
        "Design not found",
      );
    }
    const { timeZone } =
      await this.props.services.configurationService.getConfiguration(
        "general",
      );
    const settings = (appData.data as GiftCardStudioSettings) ?? {};
    const expirationMonths = settings.expirationMonths ?? 12;
    const locale = await getLocale();
    const expiresAt = DateTime.now()
      .plus({ months: expirationMonths })
      .setZone(timeZone)
      .setLocale(locale);

    const payload = {
      designId: data.designId,
      amount: data.amount,
      name: String(data.name ?? ""),
      email: String(data.email ?? ""),
      phone: String(data.phone ?? ""),
      toName: String(data.toName ?? ""),
      toEmail: String(data.toEmail ?? ""),
      message: String(data.message ?? ""),
      code: "PREVIEW",
      expiresAt,
    };
    const imageDataUrl = await this.generatePreviewImage(design, payload);
    return { success: true as const, imageDataUrl };
  }

  private async processUpdateSettings(
    appData: ConnectedAppData,
    data: Record<string, unknown>,
  ) {
    const logger = this.loggerFactory("processUpdateSettings");
    const current = (appData.data as GiftCardStudioSettings) ?? {};
    const { type: _t, ...rest } = data;
    const next = { ...current, ...rest };
    await this.props.update({ data: next });
    logger.info({ keys: Object.keys(rest) }, "Settings updated");
    return next;
  }

  private async handlePurchaseRequest(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const logger = this.loggerFactory("handlePurchaseRequest");

    const body = await request.json();
    const { success, error, data } = purchaseRequestSchema.safeParse(body);
    if (!success) {
      logger.debug({ error }, "Purchase rejected: invalid body");
      return Response.json(
        { success: false, code: "invalid_body", error },
        { status: 400 },
      );
    }

    const { amount, designId, name, email, phone, intentId, message, ...rest } =
      data;
    const settings = (appData.data as GiftCardStudioSettings) ?? {};
    if (amount < settings.minAmount || amount > settings.maxAmount) {
      logger.debug(
        {
          amount,
          minAmount: settings.minAmount,
          maxAmount: settings.maxAmount,
        },
        "Purchase rejected: amount is out of range",
      );
      return Response.json(
        { success: false, code: "amount_out_of_range" },
        { status: 400 },
      );
    }

    const intent =
      await this.props.services.paymentsService.getIntent(intentId);
    if (!intent) {
      logger.debug({ intentId }, "Purchase rejected: intent not found");
      return Response.json(
        { success: false, code: "intent_not_found" },
        { status: 404 },
      );
    }

    if (intent.amount !== amount) {
      logger.debug(
        { intentId, amount },
        "Purchase rejected: intent amount does not match",
      );
      return Response.json(
        { success: false, code: "intent_amount_does_not_match" },
        { status: 400 },
      );
    }

    const customer =
      await this.props.services.customersService.getOrUpsertCustomer(
        {
          email,
          phone,
          name,
        },
        { actor: "customer" },
      );

    if (intent.customerId !== customer._id) {
      logger.debug(
        { intentId, customerId: customer._id },
        "Purchase rejected: intent customer id does not match",
      );
      return Response.json(
        { success: false, code: "intent_customer_id_does_not_match" },
        { status: 400 },
      );
    }

    logger.debug(
      { intentId, customerId: customer._id },
      "Intent found, creating payment",
    );

    const purchaseSource = {
      actor: "customer" as const,
      actorId: customer._id,
    };

    const payment = await this.props.services.paymentsService.createPayment(
      {
        amount,
        customerId: customer._id,
        description: "giftCard",
        type: "payment",
        method: "online",
        status: "paid",
        paidAt: new Date(),
        intentId,
        appId: intent.appId,
        appName: intent.appName,
        externalId: intent.externalId,
        data: intent.data,
      },
      purchaseSource,
    );

    logger.debug(
      { paymentId: payment._id },
      "Payment created, creating gift card",
    );

    const code = await this.generateUniqueGiftCardCode();

    const giftCard = await this.props.services.giftCardsService.createGiftCard(
      {
        code,
        amount,
        customerId: customer._id,
        paymentId: payment._id,
        expiresAt: DateTime.now()
          .plus({ months: settings.expirationMonths ?? 12 })
          .endOf("day")
          .toJSDate(),
        source: {
          appName: appData.name,
          appId: appData._id,
        },
      },
      purchaseSource,
    );

    logger.debug(
      { giftCardId: giftCard._id, code, amount },
      "Gift card created, creating purchased gift card",
    );

    const repo = this.getRepositoryService(appData._id, appData.organizationId);
    const design = await repo.getDesignById(designId);

    const purchased = await repo.createPurchasedGiftCard({
      designId,
      giftCardId: giftCard._id,
      amountPurchased: amount,
      customerId: customer._id,
      toName: rest.sendToSomeoneElse ? rest.toName : customer.name,
      toEmail: rest.sendToSomeoneElse ? rest.toEmail : customer.email,
      message: message,
      cardGenerationStatus: "pending",
      invoiceGenerationStatus: "pending",
      recipientDeliveryStatus: "pending",
      customerDeliveryStatus: "pending",
      purchaseChannel: "customer",
    });

    logger.debug(
      { purchasedId: purchased._id, code, amount },
      "Purchased gift card created, scheduling gift card and invoice generation jobs",
    );

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "generate-gift-card",
        purchasedGiftCardId: purchased._id,
        sendEmails: {
          recipient: rest.sendToSomeoneElse ?? false,
          customer: true,
        },
      } satisfies GiftCardStudioJobPayload,
    });

    await this.props.services.jobService.scheduleJob({
      type: "app",
      executeAt: "now",
      appId: appData._id,
      payload: {
        type: "generate-invoice",
        purchasedGiftCardId: purchased._id,
        sendEmails: {
          recipient: rest.sendToSomeoneElse ?? false,
          customer: true,
        },
      } satisfies GiftCardStudioJobPayload,
    });

    await this.emitPurchaseCreated(
      appData,
      purchased,
      design?.name ?? "",
      {
        giftCardCode: code,
        customerName: customer.name,
        customerEmail: customer.email,
      },
      purchaseSource,
    );

    logger.debug(
      {
        purchasedId: purchased._id,
        code,
        amount,
        sendEmails: {
          recipient: rest.sendToSomeoneElse ?? false,
          customer: true,
        },
      },
      "Successfully scheduled generate gift card job",
    );

    logger.info(
      {
        purchasedId: purchased._id,
        designId,
        amount,
      },
      "Purchased gift card created",
    );

    return Response.json({ success: true, giftCardCode: code });
  }

  private async handleIntentRequest(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const logger = this.loggerFactory("handleIntentRequest");

    const body = await request.json();
    const { success, error, data } = intentRequestSchema.safeParse(body);
    if (!success) {
      logger.debug({ error }, "Intent rejected: invalid body");
      return Response.json(
        { success: false, code: "invalid_body", error },
        { status: 400 },
      );
    }
    const { amount, intentId, email, phone, name } = data;
    const settings = (appData.data as GiftCardStudioSettings) ?? {};

    if (amount < settings.minAmount || amount > settings.maxAmount) {
      logger.debug(
        {
          amount,
          minAmount: settings.minAmount,
          maxAmount: settings.maxAmount,
        },
        "Intent rejected: amount is out of range",
      );
      return Response.json(
        { success: false, code: "amount_out_of_range" },
        { status: 400 },
      );
    }

    const { booking: config, defaultApps } =
      await this.props.services.configurationService.getConfigurations(
        "booking",
        "defaultApps",
      );

    const paymentAppId = defaultApps?.paymentAppId;

    if (!config.payments?.enabled || !paymentAppId) {
      logger.debug({ config }, "Payments are not enabled");
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
    const customer =
      await this.props.services.customersService.getOrUpsertCustomer(
        {
          email,
          phone,
          name,
        },
        { actor: "customer" },
      );

    const intentUpdate = {
      amount,
      appId: app._id,
      appName: app.name,
      request: {
        amount,
      },
      customerId: customer._id,
      type: "purchase",
    } satisfies Omit<PaymentIntentUpdateModel, "status">;

    logger.debug(
      { intent: intentUpdate, isUpdating: !!intentId },
      "Creating or updating intent",
    );

    const intentResult = intentId
      ? await this.props.services.paymentsService.updateIntent(intentId, {
          ...intentUpdate,
          status: "created",
        })
      : await this.props.services.paymentsService.createIntent(intentUpdate);

    const { request: _, ...intent } = intentResult;

    logger.debug(
      { intent, isUpdating: !!intentId },
      "Successfully created or updated intent",
    );

    return Response.json({
      formProps,
      intent,
      amount,
      amountPaid: 0,
      amountTotal: amount,
      isFixedAmount: true,
    } satisfies CollectPayment);
  }

  private async handlePreviewRequest(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Response> {
    const logger = this.loggerFactory("handlePreviewRequest");
    try {
      const body = await request.json();
      const { success, error, data } =
        fetchPreviewPayloadSchema.safeParse(body);
      if (!success) {
        logger.debug({ error }, "Preview rejected: invalid body");
        return Response.json(
          { success: false, code: "invalid_body", error },
          { status: 400 },
        );
      }

      const { designId, amount, fromName, toName, message } = data;
      const settings = (appData.data as GiftCardStudioSettings) ?? {};
      if (settings.minAmount && amount < settings.minAmount) {
        logger.debug(
          { amount, minAmount: settings.minAmount },
          "Preview rejected: amount is less than minimum amount",
        );
        return Response.json(
          {
            success: false,
            code: "amount_less_than_minimum",
            error: "Amount is less than minimum amount",
          },
          { status: 400 },
        );
      }

      if (settings.maxAmount && amount > settings.maxAmount) {
        logger.debug(
          { amount, maxAmount: settings.maxAmount },
          "Preview rejected: amount is greater than maximum amount",
        );
        return Response.json(
          {
            success: false,
            code: "amount_greater_than_maximum",
            error: "Amount is greater than maximum amount",
          },
          { status: 400 },
        );
      }

      const repo = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );
      const design = await repo.getDesignById(designId as string);
      if (!design) {
        logger.debug({ designId }, "Preview rejected: design not found");
        return Response.json(
          {
            success: false,
            code: "design_not_found",
            error: "Design not found",
          },
          { status: 404 },
        );
      }
      const expirationMonths = settings.expirationMonths ?? 12;
      const locale = await getLocale();
      const { timeZone } =
        await this.props.services.configurationService.getConfiguration(
          "general",
        );

      const expiresAt = DateTime.now()
        .plus({ months: expirationMonths })
        .setLocale(locale)
        .setZone(timeZone);

      const payload = {
        designId,
        amount,
        name: fromName ?? "",
        toName: (toName || fromName) ?? "",
        message: message ?? "",
        code: "PREVIEW",
        expiresAt,
      };

      const imageDataUrl = await this.generatePreviewImage(design, payload);
      logger.info(
        { designId, dataUrlLength: imageDataUrl?.length },
        "Preview generated",
      );
      return Response.json({
        success: true,
        imageDataUrl,
      } satisfies FetchPreviewResponse);
    } catch (e) {
      logger.error({ error: e }, "Preview request failed");
      return Response.json(
        { success: false, code: "preview_failed", error: String(e) },
        { status: 500 },
      );
    }
  }

  private async generatePreviewImage(
    designDoc: DesignModel,
    payload: {
      designId: string;
      amount: number;
      name: string;
      toName: string;
      message: string;
      code: string;
      expiresAt: DateTime;
    },
  ): Promise<string> {
    const logger = this.loggerFactory("generatePreviewImage");
    logger.debug({ designId: payload.designId }, "Generating preview image");
    const design = designDoc.design;
    const { general, brand } =
      await this.props.services.configurationService.getConfigurations(
        "general",
        "brand",
      );

    const amountFormatted = formatAmountWithCurrency(
      payload.amount,
      brand.language,
      general.currency,
    );
    const fields: FieldKeyValues = {
      amount: amountFormatted,
      code: payload.code ?? "PREVIEW",
      to: payload.toName ?? "",
      from: payload.name ?? "",
      message: payload.message ?? "",
      expiresAt: payload.expiresAt,
    };

    try {
      logger.debug({ designId: payload.designId }, "Rendering gift card");
      const pngBuffer = await renderGiftCard({
        design,
        fields,
        format: "png",
      });
      const base64 = pngBuffer.toString("base64");
      logger.debug(
        { designId: payload.designId, sizeBytes: pngBuffer.length },
        "Preview rendered via renderGiftCard",
      );
      return `data:image/png;base64,${base64}`;
    } catch (e) {
      logger.warn(
        { error: e, designId: payload.designId },
        "Render failed, using fallback SVG preview",
      );
      return this.generatePreviewImageFallback({ ...payload, amountFormatted });
    }
  }

  private generatePreviewImageFallback(payload: {
    amountFormatted: string;
    name: string;
    code: string;
  }): string {
    const name = String(payload.name ?? "");
    const code = String(payload.code ?? "PREVIEW");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">
      <rect width="400" height="250" fill="#f8fafc"/>
      <text x="20" y="30" font-family="sans-serif" font-size="16" fill="#0f172a">Gift Card Preview</text>
      <text x="20" y="55" font-family="sans-serif" font-size="12" fill="#0f172a">Amount: ${escapeXml(payload.amountFormatted)}</text>
      <text x="20" y="75" font-family="sans-serif" font-size="12" fill="#0f172a">From: ${escapeXml(name || "-")}</text>
      <text x="20" y="95" font-family="sans-serif" font-size="12" fill="#0f172a">Code: ${escapeXml(code)}</text>
      <text x="20" y="130" font-family="sans-serif" font-size="14" font-weight="bold" fill="#dc2626">PREVIEW - NOT A REAL CARD</text>
    </svg>`;
    const base64 = Buffer.from(svg, "utf-8").toString("base64");
    return `data:image/svg+xml;base64,${base64}`;
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
