import { adminApi } from "@hacado/api-sdk";
import { WithTotal } from "@hacado/types";
import {
  CheckFormNameUniqueActionType,
  CreateFormActionType,
  CreateFormResponseActionType,
  DeleteFormActionType,
  DeleteFormResponseActionType,
  DeleteSelectedFormResponsesActionType,
  DeleteSelectedFormsActionType,
  FormListModel,
  FormModel,
  FormResponseModel,
  FormUpdateModel,
  GetFormByIdActionType,
  GetFormResponseByIdActionType,
  GetFormResponsesAction,
  GetFormResponsesActionType,
  GetFormsAction,
  GetFormsActionType,
  MarkFormResponsesReadActionType,
  ReassignFormResponsesActionType,
  SetFormArchivedActionType,
  SetFormsArchivedActionType,
  UpdateFormActionType,
  UpdateFormResponseActionType,
  UpdateFormResponseModel,
} from "./models";

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

export async function getForms(appId: string, query: GetFormsAction["query"]) {
  const logger = loggerFactory("getForms");
  logger.debug({ appId, query }, "Getting forms");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: GetFormsActionType,
      query,
    })) as WithTotal<FormListModel>;

    logger.info(
      { appId, resultCount: result?.items?.length || 0 },
      "Successfully retrieved forms",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error getting forms",
    );
    throw error;
  }
}

export async function getFormById(appId: string, id: string) {
  const logger = loggerFactory("getFormById");
  logger.debug({ appId, id }, "Getting form");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: GetFormByIdActionType,
      id,
    })) as FormModel;

    logger.info({ appId, id }, "Successfully retrieved form");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error getting form",
    );
    throw error;
  }
}

export async function createForm(appId: string, form: FormUpdateModel) {
  const logger = loggerFactory("createForm");
  logger.debug({ appId, form }, "Creating form");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: CreateFormActionType,
      form,
    })) as FormModel;

    logger.info({ appId }, "Successfully created form");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error creating form",
    );
    throw error;
  }
}

export async function updateForm(
  appId: string,
  id: string,
  form: FormUpdateModel,
) {
  const logger = loggerFactory("updateForm");
  logger.debug({ appId, id, form }, "Updating form");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: UpdateFormActionType,
      id,
      form,
    })) as FormModel;

    logger.info({ appId, id }, "Successfully updated form");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error updating form",
    );
    throw error;
  }
}

export async function deleteForm(appId: string, id: string) {
  const logger = loggerFactory("deleteForm");
  logger.debug({ appId, id }, "Deleting form");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: DeleteFormActionType,
      id,
    });

    logger.info({ appId, id }, "Successfully deleted form");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error deleting form",
    );
    throw error;
  }
}

export async function deleteSelectedForms(appId: string, ids: string[]) {
  const logger = loggerFactory("deleteSelectedForms");
  logger.debug({ appId, ids }, "Deleting selected forms");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: DeleteSelectedFormsActionType,
      ids,
    });

    logger.info(
      { appId, count: ids.length },
      "Successfully deleted selected forms",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error deleting selected forms",
    );
    throw error;
  }
}

export async function setFormArchived(
  appId: string,
  id: string,
  isArchived: boolean,
) {
  const logger = loggerFactory("setFormArchived");
  logger.debug({ appId, id, isArchived }, "Setting form archived");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: SetFormArchivedActionType,
      id,
      isArchived,
    });
    logger.info({ appId, id, isArchived }, "Form archived state updated");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error setting form archived",
    );
    throw error;
  }
}

export async function setFormsArchived(
  appId: string,
  ids: string[],
  isArchived: boolean,
) {
  const logger = loggerFactory("setFormsArchived");
  logger.debug({ appId, ids, isArchived }, "Setting forms archived");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: SetFormsArchivedActionType,
      ids,
      isArchived,
    });
    logger.info(
      { appId, count: ids.length, isArchived },
      "Forms archived state updated",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error setting forms archived",
    );
    throw error;
  }
}

export async function getFormResponses(
  appId: string,
  query: GetFormResponsesAction["query"],
) {
  const logger = loggerFactory("getFormResponses");
  logger.debug({ appId, query }, "Getting form responses");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: GetFormResponsesActionType,
      query,
    })) as WithTotal<FormResponseModel>;

    logger.info(
      { appId, resultCount: result?.items?.length || 0 },
      "Successfully retrieved form responses",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error getting form responses",
    );
    throw error;
  }
}

export async function getFormResponseById(appId: string, id: string) {
  const logger = loggerFactory("getFormResponseById");
  logger.debug({ appId, id }, "Getting form response");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: GetFormResponseByIdActionType,
      id,
    })) as FormResponseModel | null;

    logger.info({ appId, id }, "Successfully retrieved form response");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error getting form response",
    );
    throw error;
  }
}

export async function updateFormResponse(
  appId: string,
  id: string,
  update: UpdateFormResponseModel,
) {
  const logger = loggerFactory("updateFormResponse");
  logger.debug({ appId, id, update }, "Updating form response");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: UpdateFormResponseActionType,
      id,
      update,
    })) as FormResponseModel | null;

    logger.info({ appId, id }, "Successfully updated form response");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error updating form response",
    );
    throw error;
  }
}

export async function createFormResponse(
  appId: string,
  formId: string,
  update: UpdateFormResponseModel,
) {
  const logger = loggerFactory("createFormResponse");
  logger.debug({ appId, formId, update }, "Creating form response");

  try {
    const result = (await adminApi.apps.processRequest(appId, {
      type: CreateFormResponseActionType,
      formId,
      update,
    })) as FormResponseModel;

    logger.info({ appId }, "Successfully created form response");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error creating form response",
    );
    throw error;
  }
}

export async function deleteFormResponse(appId: string, id: string) {
  const logger = loggerFactory("deleteFormResponse");
  logger.debug({ appId, id }, "Deleting form response");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: DeleteFormResponseActionType,
      id,
    });

    logger.info({ appId, id }, "Successfully deleted form response");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error deleting form response",
    );
    throw error;
  }
}

export async function deleteSelectedFormResponses(
  appId: string,
  ids: string[],
) {
  const logger = loggerFactory("deleteSelectedFormResponses");
  logger.debug({ appId, ids }, "Deleting selected form responses");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: DeleteSelectedFormResponsesActionType,
      ids,
    });

    logger.info(
      { appId, count: ids.length },
      "Successfully deleted selected form responses",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error deleting selected form responses",
    );
    throw error;
  }
}

export async function reassignFormResponses(
  appId: string,
  ids: string[],
  customerId: string | null,
) {
  const logger = loggerFactory("reassignFormResponses");
  logger.debug(
    { appId, ids, customerId },
    "Reassigning customer for form responses",
  );

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: ReassignFormResponsesActionType,
      ids,
      customerId,
    });

    logger.info(
      { appId, count: ids.length, customerId },
      "Successfully reassigned form responses",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error reassigning form responses",
    );
    throw error;
  }
}

export async function markFormResponsesRead(appId: string) {
  const logger = loggerFactory("markFormResponsesRead");
  logger.debug({ appId }, "Marking form responses as read");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: MarkFormResponsesReadActionType,
    });

    logger.info({ appId }, "Form responses marked as read");
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error marking form responses as read",
    );
    throw error;
  }
}

export async function checkFormNameUnique(
  appId: string,
  name: string,
  id?: string,
) {
  const logger = loggerFactory("checkFormNameUnique");
  logger.debug({ appId, name, id }, "Checking form name uniqueness");

  try {
    const result = await adminApi.apps.processRequest(appId, {
      type: CheckFormNameUniqueActionType,
      name,
      id,
    });

    logger.info(
      { appId, name, id },
      "Successfully checked form name uniqueness",
    );
    return result;
  } catch (error: any) {
    logger.error(
      { appId, error: error?.message || error?.toString() },
      "Error checking form name uniqueness",
    );
    throw error;
  }
}
