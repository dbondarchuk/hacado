import { getLocale } from "@hacado/i18n/server";
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ApiRequest,
  ApiResponse,
  ConnectedAppData,
  ConnectedAppRequestError,
  ConnectedAppUninstallResult,
  Customer,
  customerEventSource,
  CustomerSearchField,
  DashboardNotification,
  type EventSource,
  IConnectedApp,
  IConnectedAppProps,
  IDashboardNotifierApp,
  SessionUser,
  systemEventSource,
} from "@hacado/types";
import {
  fileNameToMimeType,
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  parseJSON,
} from "@hacado/utils";
import { v4 as uuidv4 } from "uuid";
import { getEmailTemplate } from "../emails/utils";
import { FORM_RESPONSE_CREATED_EVENT_TYPE } from "../events";
import {
  CheckFormNameUniqueAction,
  CheckFormNameUniqueActionType,
  CreateFormAction,
  CreateFormActionType,
  CreateFormResponseAction,
  CreateFormResponseActionType,
  DeleteFormAction,
  DeleteFormActionType,
  DeleteFormResponseAction,
  DeleteFormResponseActionType,
  DeleteSelectedFormResponsesAction,
  DeleteSelectedFormResponsesActionType,
  DeleteSelectedFormsAction,
  DeleteSelectedFormsActionType,
  FormAnswer,
  FormModel,
  FormResponseModel,
  FormsFieldType,
  GetFormByIdAction,
  GetFormByIdActionType,
  GetFormResponseByIdAction,
  GetFormResponseByIdActionType,
  GetFormResponsesAction,
  GetFormResponsesActionType,
  GetFormsAction,
  GetFormsActionType,
  MarkFormResponsesReadActionType,
  ReassignFormResponsesAction,
  ReassignFormResponsesActionType,
  RequestAction,
  requestActionSchema,
  SetFormArchivedAction,
  SetFormArchivedActionType,
  SetFormsArchivedAction,
  SetFormsArchivedActionType,
  UpdateFormAction,
  UpdateFormActionType,
  UpdateFormResponseAction,
  UpdateFormResponseActionType,
} from "../models";
import { getFormResponseSchema } from "../models/utils";
import { FormsAdminAllKeys } from "../translations/types";
import { FormsRepositoryService } from "./repository-service";
import {
  getFormsUnreadResponsesBadges,
  markFormResponsesRead,
} from "./unread-responses-badge";

export class FormsConnectedApp implements IConnectedApp, IDashboardNotifierApp {
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "FormsConnectedApp",
      props.organizationId,
    );
  }

  public async getInitialNotifications(
    appData: ConnectedAppData,
    memberId: string,
    _date?: Date,
  ): Promise<DashboardNotification[]> {
    const badges = await getFormsUnreadResponsesBadges(
      appData._id,
      appData.organizationId,
      memberId,
      this.props.getDbConnection,
      this.props.services,
    );

    return [
      {
        type: "form-responses-unread",
        badges,
      },
    ];
  }

  public async processRequest(
    appData: ConnectedAppData,
    request: RequestAction,
    apiRequest?: ApiRequest,
    user?: SessionUser,
  ): Promise<any> {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      { appId: appData._id, type: request.type },
      "Processing forms request",
    );

    if (apiRequest === undefined || !user?.memberId) {
      throw new ConnectedAppRequestError(
        "invalid_forms_request",
        { request },
        400,
        "Missing request context",
      );
    }

    const memberId = user.memberId;
    const { data, success, error } = requestActionSchema.safeParse(request);
    if (!success) {
      logger.error({ error }, "Invalid forms request");
      throw new ConnectedAppRequestError(
        "invalid_forms_request",
        { request },
        400,
        error.message,
      );
    }

    switch (data.type) {
      case CreateFormActionType:
        return this.processCreateFormRequest(appData, data);
      case UpdateFormActionType:
        return this.processUpdateFormRequest(appData, data);
      case DeleteFormActionType:
        return this.processDeleteFormRequest(appData, data);
      case GetFormsActionType:
        return this.processGetFormsRequest(appData, data);
      case GetFormByIdActionType:
        return this.processGetFormByIdRequest(appData, data);
      case GetFormResponsesActionType:
        return this.processGetFormResponsesRequest(appData, data);
      case GetFormResponseByIdActionType:
        return this.processGetFormResponseByIdRequest(appData, data);
      case UpdateFormResponseActionType:
        return this.processUpdateFormResponseRequest(appData, data);
      case DeleteFormResponseActionType:
        return this.processDeleteFormResponseRequest(appData, data);
      case DeleteSelectedFormsActionType:
        return this.processDeleteSelectedFormsRequest(appData, data);
      case DeleteSelectedFormResponsesActionType:
        return this.processDeleteSelectedFormResponsesRequest(appData, data);
      case ReassignFormResponsesActionType:
        return this.processReassignFormResponsesRequest(appData, data);
      case SetFormArchivedActionType:
        return this.processSetFormArchivedRequest(appData, data);
      case SetFormsArchivedActionType:
        return this.processSetFormsArchivedRequest(appData, data);
      case CreateFormResponseActionType:
        return this.processCreateFormResponseRequest(appData, data, memberId);
      case CheckFormNameUniqueActionType:
        return this.processCheckFormNameUniqueRequest(appData, data);
      case MarkFormResponsesReadActionType:
        return this.processMarkFormResponsesReadRequest(appData, memberId);
      default:
        logger.warn({ type: (data as any).type }, "Unknown forms request type");
        return null;
    }
  }

  public async install(appData: ConnectedAppData): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug({ appId: appData._id }, "Installing forms app");

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );
      await repositoryService.install();
      logger.info({ appId: appData._id }, "Forms app installed successfully");
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error: error?.message || error?.toString() },
        "Error installing forms app",
      );
      throw error;
    }
  }

  public async unInstall(
    appData: ConnectedAppData,
  ): Promise<ConnectedAppUninstallResult> {
    const logger = this.loggerFactory("unInstall");
    logger.debug({ appId: appData._id }, "Uninstalling forms app");

    try {
      const repositoryService = this.getRepositoryService(
        appData._id,
        appData.organizationId,
      );
      await repositoryService.unInstall(appData._id);
      logger.info({ appId: appData._id }, "Forms app uninstalled successfully");
    } catch (error: any) {
      logger.error(
        { appId: appData._id, error: error?.message || error?.toString() },
        "Error uninstalling forms app",
      );
      throw error;
    }
    return { success: true, code: "ok" };
  }

  public async processAppCall(
    appData: ConnectedAppData,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("processAppCall");
    logger.debug({ appId: appData._id, slug, request }, "Processing app call");
    if (
      slug.length === 1 &&
      slug[0] === "forms" &&
      request.method.toUpperCase() === "POST"
    ) {
      const contentType = request.headers.get("content-type") ?? "";
      const isFormData =
        contentType.includes("multipart/form-data") ||
        contentType.includes("application/x-www-form-urlencoded");

      if (!isFormData) {
        logger.warn(
          { appId: appData._id, contentType },
          "Invalid content type",
        );
        return Response.json(
          {
            success: false,
            code: "invalid_content_type",
            error: "Invalid content type",
          },
          { status: 400 },
        );
      }

      const formDataResult = await this.processFormDataSubmission(
        appData,
        request,
      );

      logger.debug(
        { appId: appData._id, slug },
        "Form data submission processed",
      );
      return formDataResult;
    }

    if (
      slug.length === 2 &&
      slug[0] === "check" &&
      slug[1] === "customer-id" &&
      request.method.toUpperCase() === "POST"
    ) {
      logger.debug(
        { appId: appData._id, slug },
        "Processing check customer ID request",
      );

      const data = (await request.json()) as { customerId: string };
      if (!data.customerId) {
        logger.warn({ appId: appData._id, slug }, "Customer ID not found");
        return Response.json(
          {
            success: false,
            code: "customer_id_required",
            error: "Customer ID is required",
          },
          { status: 400 },
        );
      }

      const customer = await this.props.services.customersService.getCustomer(
        data.customerId,
      );
      if (!customer) {
        logger.warn(
          { appId: appData._id, slug, customerId: data.customerId },
          "Customer not found",
        );
      } else {
        logger.debug(
          { appId: appData._id, slug, customerId: data.customerId },
          "Customer found",
        );
      }

      return Response.json({ customerFound: !!customer }, { status: 200 });
    }

    logger.warn({ appId: appData._id, slug }, "Unknown app call");
    return Response.json(
      { success: false, code: "unknown_app_call", error: "Unknown app call" },
      { status: 404 },
    );
  }

  private async processFormDataSubmission(
    appData: ConnectedAppData,
    request: ApiRequest,
  ): Promise<ApiResponse> {
    const logger = this.loggerFactory("processFormDataSubmission");
    logger.debug({ appId: appData._id }, "Parsing form data submission");
    const formData = await request.formData();
    const formId = formData.get("formId");
    if (typeof formId !== "string" || !formId.trim()) {
      logger.warn({ formId }, "Form ID not found");
      return Response.json(
        {
          success: false,
          code: "formId_required",
          error: "formId is required",
        },
        { status: 400 },
      );
    }

    logger.debug({ formId }, "Form ID found");

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const json = formData.get("json") as string;
    if (!json) {
      logger.warn({ json }, "JSON not found");
      return Response.json(
        { success: false, code: "json_required", error: "json is required" },
        { status: 400 },
      );
    }

    logger.debug({ formId }, "JSON found");

    const data = parseJSON(json);
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_")) {
        data[key.slice(5)] = value;
      }
    }

    logger.debug({ formId }, "Form data parsed");

    const submissionUrl = (formData.get("_url") as string)?.trim() || undefined;
    const submissionIp = this.getClientIp(request);
    const submissionUserAgent =
      request.headers.get("user-agent")?.trim() || undefined;

    const form = await repositoryService.getFormById(formId.trim());
    if (!form || form.isArchived) {
      logger.warn({ formId }, "Form not found or archived");
      return Response.json(
        {
          success: false,
          code: "form_not_found_or_archived",
          error: "Form not found or archived",
        },
        { status: 404 },
      );
    }

    logger.debug({ formId }, "Form found");

    let customer: Customer | null = null;

    if (form.requireCustomerId) {
      const customerIdFromForm = (formData.get("customerId") as string)?.trim();
      if (!customerIdFromForm) {
        logger.warn(
          { formId },
          "Customer identification required but not provided",
        );
        return Response.json(
          {
            success: false,
            code: "customer_required",
            error:
              "This form is only available to identified participants. Please use the link you received or enter your access code.",
          },
          { status: 400 },
        );
      }
      customer =
        await this.props.services.customersService.getCustomer(
          customerIdFromForm,
        );
      if (!customer) {
        logger.warn(
          { formId, customerId: customerIdFromForm },
          "Customer not found for required form",
        );
        return Response.json(
          {
            success: false,
            code: "invalid_customer",
            error: "Invalid or expired access link. Please request a new link.",
          },
          { status: 400 },
        );
      }
      logger.debug(
        { formId, customerId: customer._id },
        "Customer validated for required form",
      );
    }

    const schema = getFormResponseSchema(form.fields, false);
    const result = schema.safeParse(data);
    if (!result.success) {
      logger.warn({ formId, error: result.error }, "Invalid form response");
      return Response.json(
        {
          success: false,
          code: "invalid_form_response",
          error: result.error.message,
        },
        { status: 400 },
      );
    }

    if (
      Object.keys(result.data).some(
        (name) => !form.fields.some((field) => field.name === name),
      )
    ) {
      logger.warn({ formId }, "Some answers are not in the form");
      return Response.json(
        {
          success: false,
          code: "invalid_form_response",
          error: "Some answers are not in the form",
        },
        { status: 400 },
      );
    }

    if (!form.requireCustomerId) {
      const emailFields = form.fields
        .filter((field) => field.type === "email")
        .map((field) => field.name);
      const phoneFields = form.fields
        .filter((field) => field.type === "phone")
        .map((field) => field.name);
      const nameFields = form.fields
        .filter((field) => field.type === "name")
        .map((field) => field.name);

      const searches = [
        ...emailFields.map((field) => ({
          search: result.data[field] as string,
          field: "email" as CustomerSearchField,
        })),
        ...phoneFields.map((field) => ({
          search: result.data[field] as string,
          field: "phone" as CustomerSearchField,
        })),
      ];

      logger.debug({ formId, searches }, "Searching for customer");
      customer =
        await this.props.services.customersService.findCustomerBySearchFields(
          searches,
        );
      if (!customer) {
        logger.debug({ formId }, "Customer not found");
        if (
          nameFields.length > 0 &&
          (emailFields.length > 0 || phoneFields.length > 0)
        ) {
          logger.debug(
            { formId },
            "Creating customer from name and email/phone",
          );
          customer = await this.props.services.customersService.createCustomer(
            {
              name: result.data[nameFields[0]] as string,
              email:
                emailFields.length > 0
                  ? (result.data[emailFields[0]] as string)
                  : "",
              phone:
                phoneFields.length > 0
                  ? (result.data[phoneFields[0]] as string)
                  : "",
              knownNames:
                nameFields.length > 0
                  ? nameFields
                      .slice(1)
                      .map((fieldName) => result.data[fieldName] as string)
                      .filter(Boolean)
                  : [],
              knownEmails:
                emailFields.length > 0
                  ? emailFields
                      .slice(1)
                      .map((fieldName) => result.data[fieldName] as string)
                      .filter(Boolean)
                  : [],
              knownPhones:
                phoneFields.length > 0
                  ? phoneFields
                      .slice(1)
                      .map((fieldName) => result.data[fieldName] as string)
                      .filter(Boolean)
                  : [],
              requireDeposit: "inherit",
            },
            { actor: "customer" },
          );

          logger.debug(
            { formId, customerId: customer._id },
            "Customer created",
          );
        }
      } else {
        logger.debug({ formId, customerId: customer._id }, "Customer found");
      }
    }

    logger.debug({ formId, customerId: customer?._id }, "Processing answers");
    const normalizedAnswers: FormAnswer[] = [];
    for (const [name, value] of Object.entries(result.data)) {
      let answerValue: string | boolean | string[] | null = value as
        | string
        | boolean
        | string[]
        | null;
      const field = form.fields.find((field) => field.name === name)!;
      if (value instanceof File) {
        logger.debug(
          { formId, name, value: value.name },
          "Processing file answer",
        );
        const filename = `forms/${form._id}/${uuidv4()}-${value.name}`;
        const fileSource = customer?._id
          ? customerEventSource(customer._id)
          : systemEventSource;
        const asset = await this.props.services.assetsService.createAsset(
          {
            filename,
            mimeType:
              value.type ||
              fileNameToMimeType(value.name) ||
              "application/octet-stream",
            description: `${form.name} - ${field.label}`,
            customerId: customer?._id,
          },
          value,
          fileSource,
        );
        logger.debug(
          { formId, name, value: value.name, assetId: asset._id },
          "File answer processed",
        );
        answerValue = asset.filename;
      }

      normalizedAnswers.push({
        name,
        label: form.fields.find((field) => field.name === name)!.label,
        type: form.fields.find((field) => field.name === name)!.type,
        value: answerValue,
      });
    }

    logger.debug({ formId }, "Normalized answers, creating form response");

    const response = await repositoryService.createFormResponse(form._id, {
      answers: normalizedAnswers,
      customerId: customer?._id,
      url: submissionUrl,
      ip: submissionIp ?? undefined,
      userAgent: submissionUserAgent,
    });

    logger.debug(
      { formId: form._id, responseId: response._id },
      "Successfully created form response",
    );

    await this.enqueueFormResponseHook(response, form, customer);
    await this.sendEmailNotification(appData, response, form, customer);

    return Response.json(
      { success: true, responseId: response._id },
      { status: 200 },
    );
  }

  private async processMarkFormResponsesReadRequest(
    appData: ConnectedAppData,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("processMarkFormResponsesReadRequest");
    logger.debug(
      { appId: appData._id, memberId },
      "Marking form responses read",
    );

    if (!memberId) {
      throw new ConnectedAppRequestError(
        "invalid_forms_request",
        { appId: appData._id },
        400,
        "Missing user context",
      );
    }

    await markFormResponsesRead(
      appData.organizationId,
      appData._id,
      memberId,
      this.props.services,
    );

    return { success: true };
  }

  protected getRepositoryService(appId: string, organizationId: string) {
    return new FormsRepositoryService(
      appId,
      organizationId,
      this.props.getDbConnection,
      this.props.services,
    );
  }

  private getClientIp(request: ApiRequest): string | null {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    return (
      request.headers.get("x-real-ip") ??
      request.headers.get("cf-connecting-ip") ??
      null
    );
  }

  private async processCreateFormRequest(
    appData: ConnectedAppData,
    data: CreateFormAction,
  ) {
    const logger = this.loggerFactory("processCreateFormRequest");
    logger.debug({ appId: appData._id }, "Processing create form request");

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const isUnique = await repositoryService.checkFormNameUnique(
      data.form.name,
    );
    if (!isUnique) {
      logger.error({ name: data.form.name }, "Form name not unique");
      throw new ConnectedAppRequestError(
        "form_name_not_unique",
        { name: data.form.name },
        400,
        "Form name not unique",
      );
    }

    logger.debug({ form: data.form }, "Form validated");

    const form = await repositoryService.createForm(data.form);
    logger.debug({ formId: form._id }, "Form created");
    return form;
  }

  private async processUpdateFormRequest(
    appData: ConnectedAppData,
    data: UpdateFormAction,
  ) {
    const logger = this.loggerFactory("processUpdateFormRequest");
    logger.debug({ appId: appData._id }, "Processing update form request");

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const isUnique = await repositoryService.checkFormNameUnique(
      data.form.name,
      data.id,
    );
    if (!isUnique) {
      logger.error(
        { name: data.form.name, id: data.id },
        "Form name not unique",
      );
      throw new ConnectedAppRequestError(
        "form_name_not_unique",
        { name: data.form.name, id: data.id },
        400,
        "Form name not unique",
      );
    }

    const form = await repositoryService.updateForm(data.id, data.form);
    if (!form) {
      logger.warn({ formId: data.id }, "Form not found");
      throw new ConnectedAppRequestError(
        "form_not_found",
        { formId: data.id },
        404,
        "Form not found",
      );
    }

    logger.debug({ formId: data.id }, "Form updated");
    return form;
  }

  private async processDeleteFormRequest(
    appData: ConnectedAppData,
    data: DeleteFormAction,
  ) {
    const logger = this.loggerFactory("processDeleteFormRequest");
    logger.debug(
      { appId: appData._id, id: data.id },
      "Processing delete form request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.deleteForm(data.id);
    if (!result) {
      logger.warn({ formId: data.id }, "Form not found");
      throw new ConnectedAppRequestError(
        "form_not_found",
        { formId: data.id },
        404,
        "Form not found",
      );
    }

    logger.debug({ formId: data.id }, "Form deleted");
    return result;
  }

  private async processGetFormsRequest(
    appData: ConnectedAppData,
    data: GetFormsAction,
  ) {
    const logger = this.loggerFactory("processGetFormsRequest");
    logger.debug({ appId: appData._id }, "Processing get forms request");

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.getForms(data.query);
    logger.debug(
      { forms: result.total, count: result.items.length },
      "Forms found",
    );
    return result;
  }

  private async processGetFormByIdRequest(
    appData: ConnectedAppData,
    data: GetFormByIdAction,
  ) {
    const logger = this.loggerFactory("processGetFormByIdRequest");
    logger.debug(
      { appId: appData._id, id: data.id },
      "Processing get form by id request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.getFormById(data.id);
    if (!result) {
      logger.warn({ formId: data.id }, "Form not found");
      throw new ConnectedAppRequestError(
        "form_not_found",
        { formId: data.id },
        404,
        "Form not found",
      );
    }

    logger.debug({ formId: data.id }, "Form found");
    return result;
  }

  private async processGetFormResponsesRequest(
    appData: ConnectedAppData,
    data: GetFormResponsesAction,
  ) {
    const logger = this.loggerFactory("processGetFormResponsesRequest");
    logger.debug(
      { appId: appData._id },
      "Processing get form responses request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.getFormResponses(data.query);
    logger.debug(
      { formResponses: result.total, count: result.items.length },
      "Form responses found",
    );
    return result;
  }

  private async processGetFormResponseByIdRequest(
    appData: ConnectedAppData,
    data: GetFormResponseByIdAction,
  ) {
    const logger = this.loggerFactory("processGetFormResponseByIdRequest");
    logger.debug(
      { appId: appData._id, id: data.id },
      "Processing get form response by id request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.getFormResponseById(data.id);
    if (!result) {
      logger.warn({ formResponseId: data.id }, "Form response not found");
      throw new ConnectedAppRequestError(
        "form_response_not_found",
        { formResponseId: data.id },
        404,
        "Form response not found",
      );
    }

    logger.debug({ formResponseId: data.id }, "Form response found");
    return result;
  }

  private async processUpdateFormResponseRequest(
    appData: ConnectedAppData,
    data: UpdateFormResponseAction,
  ) {
    const logger = this.loggerFactory("processUpdateFormResponseRequest");
    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const formResponse = await repositoryService.getFormResponseById(data.id);
    if (!formResponse) {
      logger.warn({ id: data.id }, "Form response not found");
      throw new ConnectedAppRequestError(
        "form_response_not_found",
        { id: data.id },
        404,
        "Form response not found",
      );
    }

    // Get form to check notification settings
    const form = await repositoryService.getFormById(formResponse.formId);
    if (!form) {
      logger.warn({ id: data.id }, "Form not found");
      throw new ConnectedAppRequestError(
        "form_not_found",
        { id: data.id },
        404,
        "Form not found",
      );
    }

    if (form.requireCustomerId && !data.update.customerId) {
      logger.warn({ id: data.id }, "Customer required for this form");
      throw new ConnectedAppRequestError(
        "customer_required",
        { id: data.id },
        400,
        "This form only accepts responses from identified participants. A customer must be assigned.",
      );
    }

    const schema = getFormResponseSchema(form.fields, true);
    const result = schema.safeParse(data.update.answers);
    if (!result.success) {
      logger.error({ error: result.error }, "Invalid form response");
      throw new ConnectedAppRequestError(
        "invalid_form_response",
        { id: data.id },
        400,
        result.error.message,
      );
    }

    if (
      Object.keys(result.data).some(
        (name) => !form.fields.some((field) => field.name === name),
      )
    ) {
      logger.error({ id: data.id }, "Invalid form response");
      throw new ConnectedAppRequestError(
        "invalid_form_response",
        { id: data.id },
        400,
        "Some answers are not in the form",
      );
    }

    const normalizedAnswers = Object.entries(result.data).map(
      ([name, value]) => ({
        name,
        label: form.fields.find((field) => field.name === name)!.label,
        type: form.fields.find((field) => field.name === name)!.type,
        value: value as string | boolean | string[] | null,
      }),
    );

    if (data.update.customerId) {
      const customer = await this.props.services.customersService.getCustomer(
        data.update.customerId,
      );
      if (!customer) {
        logger.warn(
          { customerId: data.update.customerId },
          "Customer not found",
        );
        throw new ConnectedAppRequestError(
          "customer_not_found",
          { customerId: data.update.customerId },
          404,
          "Customer not found",
        );
      }
    }

    return repositoryService.updateFormResponse(data.id, {
      answers: normalizedAnswers,
      customerId: data.update.customerId ?? undefined,
    });
  }

  private async processDeleteFormResponseRequest(
    appData: ConnectedAppData,
    data: DeleteFormResponseAction,
  ) {
    const logger = this.loggerFactory("processDeleteFormResponseRequest");
    logger.debug(
      { appId: appData._id },
      "Processing delete form response request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.deleteFormResponse(data.id);
    if (!result) {
      logger.warn({ formResponseId: data.id }, "Form response not found");
      throw new ConnectedAppRequestError(
        "form_response_not_found",
        { formResponseId: data.id },
        404,
        "Form response not found",
      );
    }

    logger.debug({ formResponseId: data.id }, "Form response deleted");
    return result;
  }

  private async processDeleteSelectedFormsRequest(
    appData: ConnectedAppData,
    data: DeleteSelectedFormsAction,
  ) {
    const logger = this.loggerFactory("processDeleteSelectedFormsRequest");
    logger.debug(
      { appId: appData._id },
      "Processing delete selected forms request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.deleteForms(data.ids);
    logger.debug({ deletedCount: result }, "Forms deleted");
    return result;
  }

  private async processDeleteSelectedFormResponsesRequest(
    appData: ConnectedAppData,
    data: DeleteSelectedFormResponsesAction,
  ) {
    const logger = this.loggerFactory(
      "processDeleteSelectedFormResponsesRequest",
    );
    logger.debug(
      { appId: appData._id },
      "Processing delete selected form responses request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.deleteFormResponses(data.ids);
    logger.debug({ deletedCount: result }, "Form responses deleted");
    return result;
  }

  private async processReassignFormResponsesRequest(
    appData: ConnectedAppData,
    data: ReassignFormResponsesAction,
  ) {
    const logger = this.loggerFactory("processReassignFormResponsesRequest");
    logger.debug(
      { appId: appData._id },
      "Processing reassign form responses request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    if (data.customerId) {
      const customer = await this.props.services.customersService.getCustomer(
        data.customerId,
      );
      if (!customer) {
        logger.warn(
          { appId: appData._id, customerId: data.customerId },
          "Customer not found",
        );
        throw new ConnectedAppRequestError(
          "customer_not_found",
          { appId: appData._id, customerId: data.customerId },
          404,
          "Customer not found",
        );
      }
    } else {
      const anyFormRequiresCustomer =
        await repositoryService.isAnyFormRequiresCustomer(data.ids);
      if (anyFormRequiresCustomer) {
        logger.warn(
          { appId: appData._id },
          "No customer id provided, but some forms require customer",
        );
        throw new ConnectedAppRequestError(
          "no_customer_id_provided",
          { appId: appData._id },
          400,
          "No customer id provided",
        );
      }
    }

    const result = await repositoryService.updateFormResponsesCustomer(
      data.ids,
      data.customerId,
    );

    logger.debug({ updatedCount: result }, "Form responses reassigned");
    return result;
  }

  private async processSetFormArchivedRequest(
    appData: ConnectedAppData,
    data: SetFormArchivedAction,
  ) {
    const logger = this.loggerFactory("processSetFormArchivedRequest");
    logger.debug(
      { appId: appData._id, id: data.id, isArchived: data.isArchived },
      "Processing set form archived request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    return repositoryService.setFormArchived(data.id, data.isArchived);
  }

  private async processSetFormsArchivedRequest(
    appData: ConnectedAppData,
    data: SetFormsArchivedAction,
  ) {
    const logger = this.loggerFactory("processSetFormsArchivedRequest");
    logger.debug(
      { appId: appData._id, ids: data.ids, isArchived: data.isArchived },
      "Processing set forms archived request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    return repositoryService.setFormsArchived(data.ids, data.isArchived);
  }

  private async processCheckFormNameUniqueRequest(
    appData: ConnectedAppData,
    data: CheckFormNameUniqueAction,
  ) {
    const logger = this.loggerFactory("processCheckFormNameUniqueRequest");
    logger.debug(
      { appId: appData._id, name: data.name, id: data.id },
      "Processing check form name uniqueness request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    const result = await repositoryService.checkFormNameUnique(
      data.name,
      data.id,
    );

    logger.debug(
      {
        appId: appData._id,
        name: data.name,
        id: data.id,
        result,
      },
      "Successfully checked form name uniqueness",
    );

    return result;
  }

  private formResponseEventSource(
    formResponse: FormResponseModel,
    customer: Customer | null | undefined,
    memberId?: string,
  ): EventSource {
    if (memberId) {
      return { actor: "member", actorId: memberId };
    }
    const cid = formResponse.customerId ?? customer?._id;
    return cid ? { actor: "customer", actorId: cid } : { actor: "customer" };
  }

  private async processCreateFormResponseRequest(
    appData: ConnectedAppData,
    data: CreateFormResponseAction,
    memberId: string,
  ) {
    const logger = this.loggerFactory("processCreateFormResponseRequest");
    logger.debug(
      { appId: appData._id },
      "Processing create form response request",
    );

    const repositoryService = this.getRepositoryService(
      appData._id,
      appData.organizationId,
    );

    // Get form to check notification settings
    const form = await repositoryService.getFormById(data.formId);
    if (!form) {
      logger.warn({ formId: data.formId }, "Form not found");
      throw new ConnectedAppRequestError(
        "form_not_found",
        { formId: data.formId },
        404,
        "Form not found",
      );
    }

    if (form.isArchived) {
      logger.warn(
        { formId: data.formId },
        "Form is archived, cannot add responses",
      );
      throw new ConnectedAppRequestError(
        "form_archived",
        { formId: data.formId },
        400,
        "Form is archived. No new responses can be added.",
      );
    }

    if (
      form.requireCustomerId &&
      (data.update.customerId == null ||
        String(data.update.customerId).trim() === "")
    ) {
      logger.warn({ formId: data.formId }, "Customer required for this form");
      throw new ConnectedAppRequestError(
        "customer_required",
        { formId: data.formId },
        400,
        "This form only accepts responses from identified participants. A customer must be assigned.",
      );
    }

    const schema = getFormResponseSchema(form.fields, true);
    const result = schema.safeParse(data.update.answers);
    if (!result.success) {
      logger.error({ error: result.error }, "Invalid form response");
      throw new ConnectedAppRequestError(
        "invalid_form_response",
        { formId: data.formId },
        400,
        result.error.message,
      );
    }

    if (
      Object.keys(result.data).some(
        (name) => !form.fields.some((field) => field.name === name),
      )
    ) {
      logger.error({ formId: data.formId }, "Invalid form response");
      throw new ConnectedAppRequestError(
        "invalid_form_response",
        { formId: data.formId },
        400,
        "Some answers are not in the form",
      );
    }

    const normalizedAnswers = Object.entries(result.data).map(
      ([name, value]) => ({
        name,
        label: form.fields.find((field) => field.name === name)!.label,
        type: form.fields.find((field) => field.name === name)!.type,
        value: value as string | boolean | string[] | null,
      }),
    );

    let customer: Customer | null = null;
    if (data.update.customerId) {
      customer = await this.props.services.customersService.getCustomer(
        data.update.customerId,
      );

      if (!customer) {
        logger.warn(
          { customerId: data.update.customerId },
          "Customer not found",
        );
        throw new ConnectedAppRequestError(
          "customer_not_found",
          { customerId: data.update.customerId },
          400,
          "Customer not found",
        );
      }
    } else {
      customer =
        await repositoryService.getOrCreateCustomerFromAnswers(
          normalizedAnswers,
        );
    }

    const created = await repositoryService.createFormResponse(data.formId, {
      answers: normalizedAnswers,
      customerId: customer?._id,
    });

    await this.enqueueFormResponseHook(created, form, customer, memberId);

    logger.debug(
      { formId: form._id, responseId: created._id },
      "Successfully created form response",
    );

    return created;
  }

  private async sendEmailNotification(
    appData: ConnectedAppData,
    formResponse: FormResponseModel,
    form: FormModel,
    customer?: Customer | null,
  ) {
    const logger = this.loggerFactory("sendEmailNotification");
    const locale = await getLocale();
    if (!form.notifications?.enabled) {
      logger.debug(
        { formId: form._id, responseId: formResponse._id },
        "Email notification not enabled, skipping",
      );
      return;
    }

    logger.debug(
      { formId: form._id, responseId: formResponse._id },
      "Sending email notification",
    );

    try {
      const config =
        await this.props.services.configurationService.getConfigurations(
          "booking",
          "general",
          "brand",
          "social",
        );

      const organization =
        await this.props.services.organizationService.getOrganization();
      if (!organization) {
        logger.error(
          { appId: appData._id, formId: form._id },
          "Organization not found",
        );
        throw new Error("Organization not found");
      }

      const member = await this.props.services.teamService.getMemberById(
        appData.memberId,
      );
      const recipientEmail =
        form.notifications.email ?? member?.email ?? config.general.email;

      if (!recipientEmail) {
        logger.debug(
          { formId: form._id },
          "No recipient email configured, skipping",
        );
        return;
      }

      const language = config.brand.language ?? "en";
      const adminUrl = getAdminUrl();
      const websiteUrl = getWebsiteUrl(organization);

      const listFormat = new Intl.ListFormat(locale, { style: "short" });
      const formatAnswerValue = (
        value: string | boolean | string[] | null,
        fieldType: FormsFieldType,
      ) => {
        if (fieldType === "checkbox") {
          return value === true
            ? "{{checkboxText.yes}}"
            : "{{checkboxText.no}}";
        }

        if (fieldType === "multiSelect" && Array.isArray(value)) {
          return listFormat.format(value as string[]);
        }

        if (fieldType === "file") {
          const url = `${websiteUrl}/assets/${value}`;
          const mimeType = fileNameToMimeType(url);

          if (mimeType?.startsWith("image/")) {
            return `![${value}](${url})`;
          }

          return `[${value}](${url})`;
        }

        return value;
      };

      const args = getArguments({
        additionalProperties: {
          form: { name: form.name, _id: form._id },
          response: {
            _id: formResponse._id,
            createdAt: formResponse.createdAt,
            url: formResponse.url,
            ip: formResponse.ip,
            userAgent: formResponse.userAgent,
            customerId: formResponse.customerId,
            answers: formResponse.answers.map((a) => ({
              label: a.label,
              valueFormatted: formatAnswerValue(a.value, a.type),
            })),
          },
        },
        config,
        adminUrl,
        websiteUrl,
        customer,
        locale: language,
      });

      const { subject, template: emailBody } = await getEmailTemplate(
        "user-notify-form-response",
        language,
        adminUrl,
        args,
        form._id,
      );

      await this.props.services.notificationService.sendEmail({
        email: {
          to: recipientEmail,
          subject,
          body: emailBody,
        },
        handledBy:
          "app_forms_admin.handlers.formResponseCreated" satisfies FormsAdminAllKeys,
        participantType: "member",
        memberId: appData.memberId,
        customerId: formResponse.customerId,
      });
      logger.debug(
        { recipientEmail, formId: form._id },
        "Form response notification email sent",
      );
    } catch (error: any) {
      logger.error(
        { error: error?.message || error?.toString() },
        "Failed to send form response notification email",
      );
      // Don't fail the response creation if email fails
    }
  }

  private async enqueueFormResponseHook(
    formResponse: FormResponseModel,
    form: FormModel,
    customer?: Customer | null,
    memberId?: string,
  ) {
    const logger = this.loggerFactory("enqueueFormResponseHook");
    // Enqueue hook for apps that want to react to form submissions
    try {
      const source = this.formResponseEventSource(
        formResponse,
        customer,
        memberId,
      );
      await this.props.services.eventService.emit(
        FORM_RESPONSE_CREATED_EVENT_TYPE,
        {
          formResponse,
          form,
          customer,
        },
        source,
      );
      logger.debug(
        { formId: form._id, responseId: formResponse._id },
        "Form response hook enqueued",
      );
    } catch (error: any) {
      logger.error(
        { error: error?.message || error?.toString() },
        "Failed to enqueue form response hook",
      );
      // Don't fail the response creation if hook fails
    }
  }
}
