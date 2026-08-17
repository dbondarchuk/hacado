import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import { Customer, IConnectedAppProps, WithTotal } from "@hacado/types";
import { escapeRegex } from "@hacado/utils";
import { ObjectId, type Filter, type Sort } from "mongodb";
import {
  FORM_RESPONSES_COLLECTION_NAME,
  FormAnswer,
  FormListModel,
  FormModel,
  FormResponseListModel,
  FormResponseModel,
  FORMS_COLLECTION_NAME,
  FormUpdateModel,
  GetFormResponsesQuery,
  GetFormsQuery,
  UpdateFormResponseModelWithNormalizedAnswers,
} from "../models";

/** Must match `@hacado/services/collections` - avoid importing services (circular dep). */
const CUSTOMERS_COLLECTION_NAME = "customers";

export class FormsRepositoryService {
  protected readonly loggerFactory: LoggerFactory;

  public constructor(
    protected readonly appId: string,
    protected readonly organizationId: string,
    protected readonly getDbConnection: IConnectedAppProps["getDbConnection"],
    protected readonly services: IConnectedAppProps["services"],
  ) {
    this.loggerFactory = getLoggerFactory(
      "FormsRepositoryService",
      this.organizationId,
    );
  }

  public async createForm(form: FormUpdateModel): Promise<FormModel> {
    const logger = this.loggerFactory("createForm");
    logger.debug({ form }, "Creating form");

    const db = await this.getDbConnection();
    const entity: FormModel = {
      ...form,
      _id: new ObjectId().toString(),
      appId: this.appId,
      organizationId: this.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    };

    await db.collection<FormModel>(FORMS_COLLECTION_NAME).insertOne(entity);

    logger.debug({ entity }, "Form created");
    return entity;
  }

  public async updateForm(
    id: string,
    form: FormUpdateModel,
  ): Promise<FormModel | null> {
    const logger = this.loggerFactory("updateForm");
    logger.debug({ id, form }, "Updating form");

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<FormModel>(FORMS_COLLECTION_NAME)
      .updateOne(
        { _id: id, organizationId: this.organizationId, appId: this.appId },
        {
          $set: {
            ...form,
            updatedAt: new Date(),
          },
        },
      );

    if (modifiedCount === 0) {
      logger.warn({ id }, "Form not found");
      return null;
    }

    const updated = await this.getFormById(id);
    logger.debug({ id }, "Form updated");
    return updated;
  }

  public async getFormResponseCount(formId: string): Promise<number> {
    const logger = this.loggerFactory("getFormResponseCount");
    logger.debug({ formId }, "Getting form response count");
    const db = await this.getDbConnection();
    const count = await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .countDocuments({
        formId,
        organizationId: this.organizationId,
        appId: this.appId,
      });
    logger.debug({ formId, count }, "Form response count");
    return count;
  }

  public async setFormArchived(
    id: string,
    isArchived: boolean,
  ): Promise<boolean> {
    const logger = this.loggerFactory("setFormArchived");
    logger.debug({ id, isArchived }, "Setting form archived");

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<FormModel>(FORMS_COLLECTION_NAME)
      .updateOne(
        { _id: id, organizationId: this.organizationId, appId: this.appId },
        { $set: { updatedAt: new Date(), isArchived } },
      );

    if (modifiedCount === 0) {
      logger.warn({ id }, "Form not found");
      return false;
    }
    return true;
  }

  public async setFormsArchived(
    ids: string[],
    isArchived: boolean,
  ): Promise<number> {
    if (ids.length === 0) return 0;
    const logger = this.loggerFactory("setFormsArchived");
    logger.debug({ ids, isArchived }, "Setting forms archived");

    const db = await this.getDbConnection();
    const { modifiedCount } = await db
      .collection<FormModel>(FORMS_COLLECTION_NAME)
      .updateMany(
        {
          _id: { $in: ids },
          organizationId: this.organizationId,
          appId: this.appId,
        },
        { $set: { updatedAt: new Date(), isArchived } },
      );

    logger.debug({ ids, modifiedCount }, "Forms archived updated");
    return modifiedCount;
  }

  public async deleteForm(id: string): Promise<boolean> {
    const logger = this.loggerFactory("deleteForm");
    logger.debug({ id }, "Deleting form");
    const db = await this.getDbConnection();

    const hasResponses = await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            formId: id,
            organizationId: this.organizationId,
            appId: this.appId,
          },
        },
      ])
      .hasNext();

    if (hasResponses) {
      logger.warn({ id }, "Form has responses, cannot delete");
      return false;
    }

    const { deletedCount } = await db
      .collection<FormModel>(FORMS_COLLECTION_NAME)
      .deleteOne({
        _id: id,
        organizationId: this.organizationId,
        appId: this.appId,
      });

    if (deletedCount === 0) {
      logger.warn({ id }, "Form not found");
      return false;
    }

    logger.debug({ id }, "Form deleted");
    return true;
  }

  public async deleteForms(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const logger = this.loggerFactory("deleteForms");
    logger.debug({ ids }, "Deleting forms");

    const db = await this.getDbConnection();
    const hasResponses = await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            formId: { $in: ids },
            organizationId: this.organizationId,
            appId: this.appId,
          },
        },
      ])
      .hasNext();

    if (hasResponses) {
      logger.warn({ ids }, "Some forms have responses, cannot delete");
      return 0;
    }

    const { deletedCount } = await db
      .collection<FormModel>(FORMS_COLLECTION_NAME)
      .deleteMany({
        _id: { $in: ids },
        organizationId: this.organizationId,
        appId: this.appId,
      });

    logger.debug({ ids, deletedCount }, "Forms deleted");
    return deletedCount;
  }

  public async getForms(
    query: GetFormsQuery,
  ): Promise<WithTotal<FormListModel>> {
    const logger = this.loggerFactory("getForms");
    logger.debug({ query }, "Getting forms");

    const db = await this.getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { createdAt: -1 };

    const $and: Filter<FormModel>[] = [
      {
        organizationId: this.organizationId,
        appId: this.appId,
      },
    ];

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      $and.push({ name: { $regex } } as any);
    }

    if (query.isArchived?.length) {
      const hasFalse = query.isArchived.includes(false);
      const hasTrue = query.isArchived.includes(true);
      if (hasFalse && hasTrue) {
        // no filter – show all
      } else if (hasFalse) {
        $and.push({
          $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
        } as any);
      } else {
        $and.push({ isArchived: true } as any);
      }
    }

    const filter: Filter<FormModel> = $and.length > 0 ? ({ $and } as any) : {};

    const [result] = await db
      .collection<FormModel>(FORMS_COLLECTION_NAME)
      .aggregate([
        {
          $lookup: {
            from: FORM_RESPONSES_COLLECTION_NAME,
            localField: "_id",
            foreignField: "formId",
            as: "responses",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                },
              },
              {
                $sort: { createdAt: -1 },
              },
            ],
          },
        },
        {
          $set: {
            responsesCount: {
              $size: "$responses",
            },
            lastResponse: {
              $first: "$responses.createdAt",
            },
          },
        },
        {
          $unset: ["responses", "notifications", "fields"],
        },
        ...(query.priorityIds?.length
          ? [
              {
                $facet: {
                  priority: [
                    {
                      $match: {
                        _id: { $in: query.priorityIds },
                        organizationId: this.organizationId,
                      },
                    },
                  ],
                  other: [
                    {
                      $match: {
                        ...filter,
                        _id: { $nin: query.priorityIds },
                      },
                    },
                    { $sort: sort },
                  ],
                },
              },
              {
                $project: {
                  values: {
                    $concatArrays: ["$priority", "$other"],
                  },
                },
              },
              { $unwind: "$values" },
              { $replaceRoot: { newRoot: "$values" } },
            ]
          : [
              {
                $match: filter,
              },
              {
                $sort: sort,
              },
            ]),
        {
          $facet: {
            paginatedResults:
              query.limit === 0
                ? undefined
                : [
                    ...(typeof query.offset !== "undefined"
                      ? [{ $skip: query.offset }]
                      : []),
                    ...(typeof query.limit !== "undefined"
                      ? [{ $limit: query.limit }]
                      : []),
                  ],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    const response: WithTotal<FormListModel> = {
      total: result?.totalCount?.[0]?.count || 0,
      items: result?.paginatedResults || [],
    };

    logger.info(
      {
        result: { total: response.total, count: response.items.length },
        query,
      },
      "Fetched forms",
    );

    return response;
  }

  public async isAnyFormRequiresCustomer(ids?: string[]): Promise<boolean> {
    const logger = this.loggerFactory("isAnyFormRequiresCustomer");
    logger.debug({ ids }, "Checking if any form requires customer");
    const db = await this.getDbConnection();

    const hasAny = await db
      .collection<FormModel>(FORMS_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            organizationId: this.organizationId,
            appId: this.appId,
            requireCustomerId: true,
            ...(ids?.length ? { _id: { $in: ids } } : {}),
          },
        },
      ])
      .hasNext();

    logger.debug({ ids, hasAny }, "Form requires customer check result");
    return hasAny;
  }

  public async getFormById(id: string): Promise<FormModel | null> {
    const logger = this.loggerFactory("getFormById");
    logger.debug({ id }, "Getting form");

    const db = await this.getDbConnection();
    const form = await db.collection<FormModel>(FORMS_COLLECTION_NAME).findOne({
      _id: id,
      organizationId: this.organizationId,
      appId: this.appId,
    });

    if (!form) {
      logger.warn({ id }, "Form not found");
      return null;
    }

    logger.debug({ id }, "Form found");
    return form;
  }

  protected extractCustomerPayloadFromAnswers(answers: FormAnswer[]) {
    let email: string | undefined;
    let phone: string | undefined;
    let name: string | undefined;

    for (const answer of answers) {
      if (
        !email &&
        answer.type === "email" &&
        typeof answer.value === "string"
      ) {
        email = answer.value;
      }
      if (
        !phone &&
        answer.type === "phone" &&
        typeof answer.value === "string"
      ) {
        phone = answer.value;
      }
      if (!name && answer.type === "name" && typeof answer.value === "string") {
        name = answer.value;
      }
    }

    return { email, phone, name };
  }

  public async getOrCreateCustomerFromAnswers(
    answers: FormAnswer[],
  ): Promise<Customer | null> {
    const logger = this.loggerFactory("getOrCreateCustomerFromAnswers");
    const { email, phone, name } =
      this.extractCustomerPayloadFromAnswers(answers);

    if (!email && !phone) {
      logger.debug("No email or phone in answers, skipping customer lookup");
      return null;
    }

    const payload: any = {};
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    if (name) payload.name = name;

    const customer = await this.services.customersService.getOrUpsertCustomer(
      payload,
      {
        actor: "customer",
      },
    );

    logger.debug(
      { customerId: customer._id },
      "Resolved customer from form answers",
    );

    return customer;
  }

  public async createFormResponse(
    formId: string,
    response: UpdateFormResponseModelWithNormalizedAnswers,
  ): Promise<FormResponseModel> {
    const logger = this.loggerFactory("createFormResponse");
    logger.debug({ response }, "Creating form response");

    const db = await this.getDbConnection();

    const entity: FormResponseModel = {
      ...response,
      formId,
      _id: new ObjectId().toString(),
      appId: this.appId,
      organizationId: this.organizationId,
      customerId: response.customerId ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .insertOne(entity);

    logger.debug(
      { id: entity._id, customerId: entity.customerId },
      "Form response created",
    );

    return entity;
  }

  public async getResponsesCountSince(since: Date): Promise<number> {
    const db = await this.getDbConnection();
    return db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .countDocuments({
        organizationId: this.organizationId,
        appId: this.appId,
        createdAt: { $gt: since },
      });
  }

  public async getFormResponses(
    query: GetFormResponsesQuery,
  ): Promise<WithTotal<FormResponseListModel>> {
    const logger = this.loggerFactory("getFormResponses");
    logger.debug({ query }, "Getting form responses");

    const db = await this.getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { createdAt: -1 };

    const $and: Filter<FormResponseModel>[] = [
      {
        organizationId: this.organizationId,
        appId: this.appId,
      },
    ];

    if (query.formId) {
      $and.push({
        formId: {
          $in: Array.isArray(query.formId) ? query.formId : [query.formId],
        },
      } as any);
    }

    if (query.customerId) {
      $and.push({
        customerId: {
          $in: Array.isArray(query.customerId)
            ? query.customerId
            : [query.customerId],
        },
      } as any);
    }

    if (query.range?.start || query.range?.end) {
      const createdAt: Record<string, any> = {};
      if (query.range.start) createdAt.$gte = query.range.start;
      if (query.range.end) createdAt.$lte = query.range.end;
      $and.push({ createdAt } as any);
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      $and.push({
        $or: [{ "answers.label": { $regex } }, { "answers.value": { $regex } }],
      } as any);
    }

    const filter: Filter<FormResponseModel> =
      $and.length > 0 ? ({ $and } as any) : {};

    const [result] = await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .aggregate([
        {
          $lookup: {
            from: CUSTOMERS_COLLECTION_NAME,
            localField: "customerId",
            foreignField: "_id",
            as: "customers",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: FORMS_COLLECTION_NAME,
            localField: "formId",
            foreignField: "_id",
            as: "forms",
          },
        },
        {
          $set: {
            customer: {
              $first: "$customers",
            },
            formName: {
              $first: "$forms.name",
            },
          },
        },
        {
          $unset: ["forms", "customers"],
        },
        {
          $match: filter,
        },
        {
          $sort: sort,
        },
        {
          $facet: {
            paginatedResults:
              query.limit === 0
                ? undefined
                : [
                    ...(typeof query.offset !== "undefined"
                      ? [{ $skip: query.offset }]
                      : []),
                    ...(typeof query.limit !== "undefined"
                      ? [{ $limit: query.limit }]
                      : []),
                  ],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ])
      .toArray();

    const response: WithTotal<FormResponseModel> = {
      total: result?.totalCount?.[0]?.count || 0,
      items: result?.paginatedResults || [],
    };

    logger.info(
      {
        result: { total: response.total, count: response.items.length },
        query,
      },
      "Fetched form responses",
    );

    return response;
  }

  public async getFormResponseById(
    id: string,
  ): Promise<FormResponseModel | null> {
    const logger = this.loggerFactory("getFormResponseById");
    logger.debug({ id }, "Getting form response");

    const db = await this.getDbConnection();
    const doc = await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .findOne({
        _id: id,
        organizationId: this.organizationId,
        appId: this.appId,
      });

    return doc ?? null;
  }

  public async updateFormResponse(
    id: string,
    update: UpdateFormResponseModelWithNormalizedAnswers,
  ): Promise<FormResponseModel | null> {
    const logger = this.loggerFactory("updateFormResponse");
    logger.debug({ id, update }, "Updating form response");

    const db = await this.getDbConnection();

    const { modifiedCount } = await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .updateOne(
        { _id: id, organizationId: this.organizationId, appId: this.appId },
        {
          $set: {
            updatedAt: new Date(),
            customerId: update.customerId ?? undefined,
            answers: update.answers,
          },
        },
      );

    if (modifiedCount === 0) {
      logger.warn({ id }, "Form response not found");
      return null;
    }

    return this.getFormResponseById(id);
  }

  public async deleteFormResponse(id: string): Promise<boolean> {
    const logger = this.loggerFactory("deleteFormResponse");
    logger.debug({ id }, "Deleting form response");

    const db = await this.getDbConnection();
    const { deletedCount } = await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .deleteOne({
        _id: id,
        organizationId: this.organizationId,
        appId: this.appId,
      });

    if (deletedCount === 0) {
      logger.warn({ id }, "Form response not found");
      return false;
    }

    logger.debug({ id }, "Form response deleted");
    return true;
  }

  public async updateFormResponsesCustomer(
    ids: string[],
    customerId?: string | null,
  ): Promise<number> {
    if (ids.length === 0) return 0;
    const logger = this.loggerFactory("updateFormResponsesCustomer");
    logger.debug(
      { ids, customerId },
      "Reassigning customer for form responses",
    );

    const db = await this.getDbConnection();
    const updateDoc: Record<string, unknown> =
      customerId !== null
        ? { $set: { updatedAt: new Date(), customerId } }
        : { $set: { updatedAt: new Date() }, $unset: { customerId: "" } };
    const { modifiedCount } = await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .updateMany(
        {
          _id: { $in: ids },
          organizationId: this.organizationId,
          appId: this.appId,
        },
        updateDoc,
      );

    logger.debug(
      { ids, customerId, modifiedCount },
      "Form responses customer updated",
    );
    return modifiedCount;
  }

  public async deleteFormResponses(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const logger = this.loggerFactory("deleteFormResponses");
    logger.debug({ ids }, "Deleting form responses");

    const db = await this.getDbConnection();
    const { deletedCount } = await db
      .collection<FormResponseModel>(FORM_RESPONSES_COLLECTION_NAME)
      .deleteMany({
        _id: { $in: ids },
        organizationId: this.organizationId,
        appId: this.appId,
      });

    logger.debug({ ids, deletedCount }, "Form responses deleted");
    return deletedCount;
  }

  public async checkFormNameUnique(
    name: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkFormNameUnique");
    logger.debug({ name, id }, "Checking form name uniqueness");
    const filter: Filter<FormModel> = {
      name,
      organizationId: this.organizationId,
      appId: this.appId,
    };

    if (id) {
      filter._id = { $ne: id };
    }

    const db = await this.getDbConnection();
    const hasNext = await db
      .collection<FormModel>(FORMS_COLLECTION_NAME)
      .aggregate([{ $match: filter }])
      .hasNext();

    const result = !hasNext;

    logger.debug({ name, id, result }, "Form name uniqueness check result");
    return result;
  }

  public async unInstall(appId: string): Promise<void> {
    const logger = this.loggerFactory("unInstall");
    logger.debug({ appId }, "Uninstalling forms app");

    const db = await this.getDbConnection();
    await db
      .collection(FORMS_COLLECTION_NAME)
      .deleteMany({ appId, organizationId: this.organizationId });
    await db
      .collection(FORM_RESPONSES_COLLECTION_NAME)
      .deleteMany({ appId, organizationId: this.organizationId });

    logger.debug({ appId }, "Forms app uninstalled");
  }

  public async install(): Promise<void> {
    const logger = this.loggerFactory("install");
    logger.debug("Installing forms app");

    const db = await this.getDbConnection();

    logger.debug("Creating forms collection");
    const formsCollection = await db.createCollection(FORMS_COLLECTION_NAME);
    logger.debug("Forms collection created");

    const formsIndexes: Record<string, Record<string, 1>> = {
      organizationId_appId_1: { organizationId: 1, appId: 1 },
      organizationId_appId_isArchived_1: {
        organizationId: 1,
        appId: 1,
        isArchived: 1,
      },
      organizationId_appId_name_1: { organizationId: 1, appId: 1, name: 1 },
      organizationId_appId_createdAt_1: {
        organizationId: 1,
        appId: 1,
        createdAt: 1,
      },
      organizationId_appId_updatedAt_1: {
        organizationId: 1,
        appId: 1,
        updatedAt: 1,
      },
    };

    for (const [name, index] of Object.entries(formsIndexes)) {
      logger.debug(`Checking if forms index ${name} exists`);
      if (await formsCollection.indexExists(name)) {
        logger.debug(`Forms index ${name} already exists`);
        continue;
      }
      logger.debug(`Creating forms index ${name}`);
      await formsCollection.createIndex(index, { name });
    }

    logger.debug("Creating form-responses collection");
    const responsesCollection = await db.createCollection(
      FORM_RESPONSES_COLLECTION_NAME,
    );
    logger.debug("Form-responses collection created");

    const responsesIndexes: Record<string, Record<string, 1>> = {
      organizationId_appId_1: { organizationId: 1, appId: 1 },
      organizationId_appId_formId_1: { organizationId: 1, appId: 1, formId: 1 },
      organizationId_appId_customerId_1: {
        organizationId: 1,
        appId: 1,
        customerId: 1,
      },
      organizationId_appId_createdAt_1: {
        organizationId: 1,
        appId: 1,
        createdAt: 1,
      },
      organizationId_appId_formId_createdAt_1: {
        organizationId: 1,
        appId: 1,
        formId: 1,
        createdAt: 1,
      },
    };

    for (const [name, index] of Object.entries(responsesIndexes)) {
      logger.debug(`Checking if form-responses index ${name} exists`);
      if (await responsesCollection.indexExists(name)) {
        logger.debug(`Form-responses index ${name} already exists`);
        continue;
      }
      logger.debug(`Creating form-responses index ${name}`);
      await responsesCollection.createIndex(index, { name });
    }

    logger.debug("Forms app installed");
  }
}
