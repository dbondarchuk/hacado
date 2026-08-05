import { adminApi } from "@hacado/api-sdk";
import { WithTotal } from "@hacado/types";
import {
  CheckDesignNameUniqueActionType,
  CreateDesignActionType,
  CreatePurchasedGiftCardAction,
  CreatePurchasedGiftCardActionType,
  DeleteDesignActionType,
  DeleteDesignsActionType,
  DeletePurchasedGiftCardActionType,
  DesignListModel,
  DesignModel,
  DesignUpdateModel,
  GetDesignByIdActionType,
  GetDesignsAction,
  GetDesignsActionType,
  GetPreviewActionType,
  GetPurchasedGiftCardByIdActionType,
  GetPurchasedGiftCardsAction,
  GetPurchasedGiftCardsActionType,
  GetSettingsActionType,
  MarkGiftCardStudioPurchasesReadActionType,
  PurchasedGiftCardListModel,
  RegenerateGiftCardAssetsActionType,
  ResendEmailActionType,
  SetDesignArchivedActionType,
  SetDesignsArchivedActionType,
  UpdateDesignActionType,
  UpdateSettingsActionType,
} from "./models";
import { GiftCardStudioSettings } from "./models/settings";

const loggerFactory = (action: string) => ({
  debug: (data: any, message: string) => {
    console.debug(`[${action}] DEBUG:`, message, data);
  },
  info: (data: any, message: string) => {
    console.log(`[${action}] INFO:`, message, data);
  },
  error: (data: any, message: string) => {
    console.error(`[${action}] ERROR:`, message, data);
  },
});

export async function getDesigns(
  appId: string,
  query: GetDesignsAction["query"],
) {
  const logger = loggerFactory("getDesigns");
  logger.debug({ appId, query }, "Getting designs");

  const result = (await adminApi.apps.processRequest(appId, {
    type: GetDesignsActionType,
    query,
  })) as WithTotal<DesignListModel>;

  logger.debug(
    { appId, query, result: result.items.length, total: result.total },
    "Designs got",
  );
  return result;
}

export async function getDesignById(appId: string, id: string) {
  const logger = loggerFactory("getDesignById");
  logger.debug({ appId, id }, "Getting design by id");

  const result = (await adminApi.apps.processRequest(appId, {
    type: GetDesignByIdActionType,
    id,
  })) as DesignModel | null;

  logger.debug({ appId, id, name: result?.name }, "Design got");
  return result;
}

export async function createDesign(appId: string, design: DesignUpdateModel) {
  const logger = loggerFactory("createDesign");
  logger.debug({ appId, design }, "Creating design");

  const result = (await adminApi.apps.processRequest(appId, {
    type: CreateDesignActionType,
    design,
  })) as DesignModel;

  logger.debug({ appId, design, resultId: result._id }, "Design created");
  return result;
}

export async function updateDesign(
  appId: string,
  id: string,
  design: DesignUpdateModel,
) {
  const logger = loggerFactory("updateDesign");
  logger.debug({ appId, id, design }, "Updating design");

  const result = (await adminApi.apps.processRequest(appId, {
    type: UpdateDesignActionType,
    id,
    design,
  })) as DesignModel;

  logger.debug({ appId, id, resultId: result._id }, "Design updated");
  return result;
}

export async function deleteDesign(appId: string, id: string) {
  const logger = loggerFactory("deleteDesign");
  logger.debug({ appId, id }, "Deleting design");

  const result = (await adminApi.apps.processRequest(appId, {
    type: DeleteDesignActionType,
    id,
  })) as boolean;

  logger.debug({ appId, id, result }, "Design deleted");
  return result;
}

export async function deleteDesigns(appId: string, ids: string[]) {
  const logger = loggerFactory("deleteDesigns");
  logger.debug({ appId, ids }, "Deleting designs");

  const result = (await adminApi.apps.processRequest(appId, {
    type: DeleteDesignsActionType,
    ids,
  })) as boolean;

  logger.debug({ appId, ids, result }, "Designs deleted");
  return result;
}

export async function setDesignArchived(
  appId: string,
  id: string,
  isArchived: boolean,
) {
  const logger = loggerFactory("setDesignArchived");
  logger.debug({ appId, id, isArchived }, "Setting design archived");

  const result = (await adminApi.apps.processRequest(appId, {
    type: SetDesignArchivedActionType,
    id,
    isArchived,
  })) as boolean;

  logger.debug({ appId, id, result }, "Design archived");
  return result;
}

export async function setDesignsArchived(
  appId: string,
  ids: string[],
  isArchived: boolean,
) {
  const logger = loggerFactory("setDesignsArchived");
  logger.debug({ appId, ids, isArchived }, "Setting designs archived");

  const result = (await adminApi.apps.processRequest(appId, {
    type: SetDesignsArchivedActionType,
    ids,
    isArchived,
  })) as boolean;

  logger.debug({ appId, ids, result }, "Designs archived");
  return result;
}

export async function checkDesignNameUnique(
  appId: string,
  name: string,
  id?: string,
) {
  const logger = loggerFactory("checkDesignNameUnique");
  logger.debug({ appId, name, id }, "Checking design name uniqueness");

  const result = (await adminApi.apps.processRequest(appId, {
    type: CheckDesignNameUniqueActionType,
    name,
    id,
  })) as boolean;

  logger.debug({ appId, name, id, result }, "Design name unique");
  return result;
}

export async function getPurchasedGiftCards(
  appId: string,
  query: GetPurchasedGiftCardsAction["query"],
) {
  const logger = loggerFactory("getPurchasedGiftCards");
  logger.debug({ appId, query }, "Getting purchased gift cards");

  const result = (await adminApi.apps.processRequest(appId, {
    type: GetPurchasedGiftCardsActionType,
    query,
  })) as WithTotal<PurchasedGiftCardListModel>;

  logger.debug(
    { appId, query, result: result.items.length, total: result.total },
    "Purchased gift cards got",
  );
  return result;
}

export async function getPurchasedGiftCardById(appId: string, id: string) {
  const logger = loggerFactory("getPurchasedGiftCardById");
  logger.debug({ appId, id }, "Getting purchased gift card by id");

  const result = (await adminApi.apps.processRequest(appId, {
    type: GetPurchasedGiftCardByIdActionType,
    id,
  })) as PurchasedGiftCardListModel | null;

  logger.debug(
    { appId, id, code: result?.giftCardCode },
    "Purchased gift card got",
  );
  return result;
}

export async function createPurchasedGiftCard(
  appId: string,
  purchase: CreatePurchasedGiftCardAction["purchase"],
) {
  const logger = loggerFactory("createPurchasedGiftCard");
  logger.debug({ appId, purchase }, "Creating purchased gift card");

  const result = (await adminApi.apps.processRequest(appId, {
    type: CreatePurchasedGiftCardActionType,
    purchase,
  })) as PurchasedGiftCardListModel;

  logger.debug(
    { appId, purchase, resultId: result._id },
    "Purchased gift card created",
  );
  return result;
}

export type GetPreviewPayload = {
  designId: string;
  amount: number;
  name?: string;
  email?: string;
  phone?: string;
  toName?: string;
  toEmail?: string;
  message?: string;
};

export async function getPreviewImage(
  appId: string,
  payload: GetPreviewPayload,
): Promise<{ success: true; imageDataUrl: string }> {
  const logger = loggerFactory("getPreviewImage");
  logger.debug({ appId, payload }, "Getting preview image");

  const result = (await adminApi.apps.processRequest(appId, {
    type: GetPreviewActionType,
    ...payload,
  })) as { success: true; imageDataUrl: string };

  logger.debug({ appId }, "Preview image got");
  return result;
}

export async function getSettings(appId: string) {
  const logger = loggerFactory("getSettings");
  logger.debug({ appId }, "Getting settings");

  const result = (await adminApi.apps.processRequest(appId, {
    type: GetSettingsActionType,
  })) as GiftCardStudioSettings;

  logger.debug({ appId }, "Settings got");
  return result;
}

export async function updateSettings(
  appId: string,
  settings: Partial<GiftCardStudioSettings>,
) {
  const logger = loggerFactory("updateSettings");
  logger.debug({ appId }, "Updating settings");

  const result = (await adminApi.apps.processRequest(appId, {
    type: UpdateSettingsActionType,
    ...settings,
  })) as GiftCardStudioSettings;

  logger.debug({ appId }, "Settings updated");
  return result;
}

export async function regenerateGiftCardAssets(
  appId: string,
  id: string,
  assetType: "gift-card" | "invoice",
) {
  const logger = loggerFactory("regenerateGiftCardAssets");
  logger.debug({ appId, id, assetType }, "Regenerating gift card assets");

  const result = (await adminApi.apps.processRequest(appId, {
    type: RegenerateGiftCardAssetsActionType,
    id,
    assetType,
  })) as boolean;

  logger.debug(
    { appId, id, assetType, result },
    "Gift card assets scheduled for regeneration",
  );
  return result;
}

export async function deletePurchasedGiftCard(appId: string, id: string) {
  const logger = loggerFactory("deletePurchasedGiftCard");
  logger.debug({ appId, id }, "Deleting purchased gift card");

  const result = (await adminApi.apps.processRequest(appId, {
    type: DeletePurchasedGiftCardActionType,
    id,
  })) as boolean;

  logger.debug({ appId, id, result }, "Purchased gift card deleted");
  return result;
}

export async function markGiftCardStudioPurchasesRead(appId: string) {
  const logger = loggerFactory("markGiftCardStudioPurchasesRead");
  logger.debug({ appId }, "Marking gift card studio purchases as read");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: MarkGiftCardStudioPurchasesReadActionType,
    });

    logger.info({ appId }, "Gift card studio purchases marked as read");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error marking gift card studio purchases as read",
    );
    throw error;
  }
}

export async function resendEmail(
  appId: string,
  id: string,
  participantType: "customer" | "recipient",
) {
  const logger = loggerFactory("resendEmail");
  logger.debug(
    { appId, id, participantType },
    `Resending email to ${participantType}`,
  );

  const result = (await adminApi.apps.processRequest(appId, {
    type: ResendEmailActionType,
    id,
    participantType,
  })) as boolean;

  logger.debug(
    { appId, id, participantType, result },
    `Email ${participantType} resent`,
  );
  return result;
}
