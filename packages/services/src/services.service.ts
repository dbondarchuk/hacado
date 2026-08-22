import {
  ADDON_CREATED_EVENT_TYPE,
  ADDON_DELETED_EVENT_TYPE,
  ADDON_UPDATED_EVENT_TYPE,
  AddonsType,
  ApplyCustomerDiscountRequest,
  APPOINTMENT_OPTION_CREATED_EVENT_TYPE,
  APPOINTMENT_OPTION_DELETED_EVENT_TYPE,
  APPOINTMENT_OPTION_UPDATED_EVENT_TYPE,
  AppointmentAddon,
  AppointmentAddonUpdateModel,
  AppointmentEntity,
  AppointmentOption,
  AppointmentOptionUpdateModel,
  BillingPlanTier,
  DateRange,
  Discount,
  DISCOUNT_CREATED_EVENT_TYPE,
  DISCOUNT_DELETED_EVENT_TYPE,
  DISCOUNT_UPDATED_EVENT_TYPE,
  DiscountType,
  DiscountUpdateModel,
  FIELD_CREATED_EVENT_TYPE,
  FIELD_DELETED_EVENT_TYPE,
  FIELD_UPDATED_EVENT_TYPE,
  FieldsType,
  FieldType,
  filterCatalogNodes,
  flattenCatalogOptionIds,
  FREE_TIER_LIMITS,
  IConfigurationService,
  IEventService,
  IOrganizationService,
  IServicesService,
  Query,
  ServiceField,
  ServiceFieldUpdateModel,
  ServiceLimitReachedError,
  WithTotal,
  type AddonCreatedPayload,
  type AddonDeletedPayload,
  type AddonUpdatedPayload,
  type AppointmentOptionCreatedPayload,
  type AppointmentOptionDeletedPayload,
  type AppointmentOptionUpdatedPayload,
  type DiscountCreatedPayload,
  type DiscountDeletedPayload,
  type DiscountUpdatedPayload,
  type EventSource,
  type FieldCreatedPayload,
  type FieldDeletedPayload,
  type FieldUpdatedPayload,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { DateTime } from "luxon";
import { Filter, ObjectId, Sort } from "mongodb";
import { resolvePlanTierFromOrganization } from "./billing/subscription-entitlements";
import {
  ADDONS_COLLECTION_NAME,
  APPOINTMENTS_COLLECTION_NAME,
  DISCOUNTS_COLLECTION_NAME,
  FIELDS_COLLECTION_NAME,
  OPTIONS_COLLECTION_NAME,
} from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

export class ServicesService extends BaseService implements IServicesService {
  public constructor(
    organizationId: string,
    protected readonly configurationService: IConfigurationService,
    protected readonly eventService: IEventService,
    private readonly organizationService: IOrganizationService,
  ) {
    super("ServicesService", organizationId);
  }

  private async assertFreeTierServiceLimit(): Promise<void> {
    const organization = await this.organizationService.getOrganization();
    const planTier = resolvePlanTierFromOrganization(organization);
    if (planTier !== BillingPlanTier.Free) {
      return;
    }

    const db = await getDbConnection();
    const count = await db
      .collection<AppointmentOption>(OPTIONS_COLLECTION_NAME)
      .countDocuments({ organizationId: this.organizationId });

    if (count >= FREE_TIER_LIMITS.services) {
      throw new ServiceLimitReachedError(FREE_TIER_LIMITS.services);
    }
  }

  /** Fields */

  public async getField(id: string): Promise<ServiceField | null> {
    const logger = this.loggerFactory("getField");
    logger.debug({ fieldId: id }, "Getting field by id");

    const db = await getDbConnection();
    const fields = db.collection<ServiceField>(FIELDS_COLLECTION_NAME);

    const field = await fields.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!field) {
      logger.warn({ fieldId: id }, "Field not found");
    } else {
      logger.debug({ fieldId: id, name: field.name }, "Field found");
    }

    return field;
  }

  public async getFields<T extends boolean | undefined>(
    query: Query & {
      type: FieldType[];
    },
    includeUsage?: T,
  ): Promise<WithTotal<FieldsType<T>>> {
    const logger = this.loggerFactory("getFields");
    logger.debug({ query, includeUsage }, "Getting fields");

    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { updatedAt: -1 };

    const filter: Filter<ServiceField> = {
      organizationId: this.organizationId,
    };

    if (query.type) {
      filter.type = {
        $in: query.type,
      };
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<ServiceField>(
        { $regex },
        "name",
        "data.description",
        "data.label",
        "data.options",
      );

      filter.$or = queries;
    }

    const [result] = await db
      .collection<ServiceField>(FIELDS_COLLECTION_NAME)
      .aggregate([
        ...(includeUsage
          ? [
              {
                $lookup: {
                  from: ADDONS_COLLECTION_NAME,
                  localField: "_id",
                  foreignField: "fields.id",
                  pipeline: [
                    {
                      $match: {
                        organizationId: this.organizationId,
                      },
                    },
                    {
                      $project: {
                        _id: 1,
                        name: 1,
                      },
                    },
                  ],
                  as: "addons",
                },
              },
              {
                $lookup: {
                  from: OPTIONS_COLLECTION_NAME,
                  localField: "_id",
                  foreignField: "fields.id",
                  pipeline: [
                    {
                      $match: {
                        organizationId: this.organizationId,
                      },
                    },
                    {
                      $project: {
                        _id: 1,
                        name: 1,
                      },
                    },
                  ],
                  as: "options",
                },
              },
            ]
          : []),
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

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.debug(
      {
        query,
        result: { total: response.total, count: response.items.length },
      },
      "Fetched fields",
    );

    return response;
  }

  public async getFieldsByNames(names: string[]): Promise<ServiceField[]> {
    const logger = this.loggerFactory("getFieldsByNames");
    logger.debug({ names }, "Getting fields by names");

    const db = await getDbConnection();
    const fields = db.collection<ServiceField>(FIELDS_COLLECTION_NAME);

    const result = await fields
      .find({
        name: {
          $in: names,
        },
        organizationId: this.organizationId,
      })
      .toArray();

    logger.debug({ names, count: result.length }, "Fields found");

    return result;
  }

  public async getFieldsById(ids: string[]): Promise<ServiceField[]> {
    const logger = this.loggerFactory("getFieldsById");
    logger.debug({ ids }, "Getting fields by ids");

    const db = await getDbConnection();
    const fields = db.collection<ServiceField>(FIELDS_COLLECTION_NAME);

    const result = await fields
      .find({
        _id: {
          $in: ids,
        },
        organizationId: this.organizationId,
      })
      .toArray();

    logger.debug({ ids, count: result.length }, "Fields found");

    return result;
  }

  public async createField(
    field: ServiceFieldUpdateModel,
    source: EventSource,
  ): Promise<ServiceField> {
    const logger = this.loggerFactory("createField");
    logger.debug(
      { field: { name: field.name, type: field.type } },
      "Creating new field",
    );

    const dbField: ServiceField = {
      ...field,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      updatedAt: DateTime.utc().toJSDate(),
    };

    if (!this.checkFieldUniqueName(field.name)) {
      logger.error({ name: field.name }, "Field name already exists");
      throw new Error("Name already exists");
    }

    const db = await getDbConnection();
    const fields = db.collection<ServiceField>(FIELDS_COLLECTION_NAME);

    await fields.insertOne(dbField);

    await this.eventService.emit(
      FIELD_CREATED_EVENT_TYPE,
      {
        field: dbField,
      } satisfies FieldCreatedPayload,
      source,
    );

    logger.debug(
      { fieldId: dbField._id, name: dbField.name },
      "Successfully created field",
    );

    return dbField;
  }

  public async updateField(
    id: string,
    update: ServiceFieldUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updateField");
    logger.debug({ id, update }, "Updating field");

    const db = await getDbConnection();
    const fields = db.collection<ServiceField>(FIELDS_COLLECTION_NAME);

    const { _id, organizationId, ...updateObj } = update as ServiceField; // Remove fields in case it slips here

    if (!this.checkFieldUniqueName(update.name, id)) {
      throw new Error("Name already exists");
    }

    updateObj.updatedAt = DateTime.utc().toJSDate();

    const { modifiedCount } = await fields.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    if (modifiedCount === 0) {
      logger.warn({ fieldId: id }, "Field not found after update");
      return;
    }

    const updatedField = await this.getField(id);

    await this.eventService.emit(
      FIELD_UPDATED_EVENT_TYPE,
      {
        field: updatedField!,
        update: updateObj,
      } satisfies FieldUpdatedPayload,
      source,
    );

    logger.debug({ fieldId: id, name: update.name }, "Field updated");
  }

  public async deleteField(
    id: string,
    source: EventSource,
  ): Promise<ServiceField | null> {
    const logger = this.loggerFactory("deleteField");
    logger.debug({ id }, "Deleting field");

    const db = await getDbConnection();
    const fields = db.collection<ServiceField>(FIELDS_COLLECTION_NAME);

    const field = await fields.findOneAndDelete({
      _id: id,
      organizationId: this.organizationId,
    });
    if (!field) {
      logger.warn({ fieldId: id }, "Field not found");
      return null;
    }

    const addons = db.collection<AppointmentAddon>(ADDONS_COLLECTION_NAME);
    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);
    const { modifiedCount: addonsModifiedCount } = await addons.updateMany(
      {
        organizationId: this.organizationId,
      },
      {
        $pull: {
          fields: {
            id,
          },
        },
      },
    );

    const { modifiedCount: optionsModifiedCount } = await options.updateMany(
      {
        organizationId: this.organizationId,
      },
      {
        $pull: {
          fields: {
            id,
          },
        },
      },
    );

    logger.debug(
      { fieldId: id, addonsModifiedCount, optionsModifiedCount },
      "Field deleted",
    );

    await this.eventService.emit(
      FIELD_DELETED_EVENT_TYPE,
      {
        fieldIds: [id],
      } satisfies FieldDeletedPayload,
      source,
    );

    return field;
  }

  public async deleteFields(ids: string[], source: EventSource): Promise<void> {
    const logger = this.loggerFactory("deleteFields");
    logger.debug({ ids }, "Deleting fields");

    const db = await getDbConnection();

    const fields = db.collection<ServiceField>(FIELDS_COLLECTION_NAME);

    const { deletedCount: fieldsDeletedCount } = await fields.deleteMany({
      _id: {
        $in: ids,
      },
      organizationId: this.organizationId,
    });

    const addons = db.collection<AppointmentAddon>(ADDONS_COLLECTION_NAME);
    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);
    const { modifiedCount: addonsModifiedCount } = await addons.updateMany(
      {
        organizationId: this.organizationId,
      },
      {
        $pull: {
          fields: {
            id: {
              $in: ids,
            },
          },
        },
      },
    );

    const { modifiedCount: optionsModifiedCount } = await options.updateMany(
      {
        organizationId: this.organizationId,
      },
      {
        $pull: {
          fields: {
            id: {
              $in: ids,
            },
          },
        },
      },
    );

    await this.eventService.emit(
      FIELD_DELETED_EVENT_TYPE,
      {
        fieldIds: ids,
      } satisfies FieldDeletedPayload,
      source,
    );

    logger.debug(
      { fieldsDeletedCount, addonsModifiedCount, optionsModifiedCount },
      "Fields deleted",
    );
  }

  public async checkFieldUniqueName(
    name: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkFieldUniqueName");
    logger.debug({ name, id }, "Checking field unique name");

    const db = await getDbConnection();
    const fields = db.collection<ServiceField>(FIELDS_COLLECTION_NAME);

    const filter: Filter<ServiceField> = {
      name,
      organizationId: this.organizationId,
    };

    if (id) {
      filter._id = {
        $ne: id,
      };
    }

    const hasNext = await fields.aggregate([{ $match: filter }]).hasNext();
    logger.debug({ name, id, hasNext }, "Field unique name check result");
    return !hasNext;
  }

  /** Addons */

  public async getAddon(id: string): Promise<AppointmentAddon | null> {
    const logger = this.loggerFactory("getAddon");
    logger.debug({ id }, "Getting addon");

    const db = await getDbConnection();
    const addons = db.collection<AppointmentAddon>(ADDONS_COLLECTION_NAME);

    const result = await addons.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!result) {
      logger.warn({ addonId: id }, "Addon not found");
    } else {
      logger.debug({ addonId: id, name: result.name }, "Addon found");
    }

    return result;
  }

  public async getAddonsById(ids: string[]): Promise<AppointmentAddon[]> {
    const logger = this.loggerFactory("getAddonsById");
    logger.debug({ ids }, "Getting addons by ids");

    const db = await getDbConnection();
    const addons = db.collection<AppointmentAddon>(ADDONS_COLLECTION_NAME);

    const result = await addons
      .find({
        _id: {
          $in: ids,
        },
        organizationId: this.organizationId,
      })
      .toArray();

    logger.debug({ ids, count: result.length }, "Addons found");

    return result;
  }

  public async getAddons<T extends boolean | undefined>(
    query: Query,
    includeUsage?: T,
  ): Promise<WithTotal<AddonsType<T>>> {
    const logger = this.loggerFactory("getAddons");
    logger.debug({ query, includeUsage }, "Getting addons");
    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { updatedAt: -1 };

    const filter: Filter<AppointmentAddon> = {
      organizationId: this.organizationId,
    };

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<AppointmentAddon>(
        { $regex },
        "name",
        "duration",
        "price",
        "description",
      );

      filter.$or = queries;
    }

    const [result] = await db
      .collection<AppointmentAddon>(ADDONS_COLLECTION_NAME)
      .aggregate([
        ...(includeUsage
          ? [
              {
                $lookup: {
                  from: OPTIONS_COLLECTION_NAME,
                  localField: "_id",
                  foreignField: "addons.id",
                  pipeline: [
                    {
                      $match: {
                        organizationId: this.organizationId,
                      },
                    },
                    {
                      $project: {
                        _id: 1,
                        name: 1,
                      },
                    },
                  ],
                  as: "options",
                },
              },
            ]
          : []),
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

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.debug(
      {
        query,
        includeUsage,
        result: { total: response.total, count: response.items.length },
      },
      "Fetched addons",
    );

    return response;
  }

  public async createAddon(
    addon: AppointmentAddonUpdateModel,
    source: EventSource,
  ): Promise<AppointmentAddon> {
    const logger = this.loggerFactory("createAddon");
    logger.debug({ addon }, "Creating addon");
    const dbAddon: AppointmentAddon = {
      ...addon,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      updatedAt: DateTime.utc().toJSDate(),
    };

    if (!this.checkAddonUniqueName(addon.name)) {
      throw new Error("Name already exists");
    }

    const db = await getDbConnection();
    const addons = db.collection<AppointmentAddon>(ADDONS_COLLECTION_NAME);

    await addons.insertOne(dbAddon);

    await this.eventService.emit(
      ADDON_CREATED_EVENT_TYPE,
      {
        addon: dbAddon,
      } satisfies AddonCreatedPayload,
      source,
    );

    logger.debug({ addonId: dbAddon._id, name: dbAddon.name }, "Addon created");

    return dbAddon;
  }

  public async updateAddon(
    id: string,
    update: AppointmentAddonUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updateAddon");
    logger.debug({ id, update }, "Updating addon");
    const db = await getDbConnection();
    const addons = db.collection<AppointmentAddon>(ADDONS_COLLECTION_NAME);

    const { _id, organizationId, ...updateObj } = update as AppointmentAddon; // Remove fields in case it slips here

    if (!this.checkAddonUniqueName(update.name, id)) {
      throw new Error("Name already exists");
    }

    updateObj.updatedAt = DateTime.utc().toJSDate();

    const { modifiedCount } = await addons.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    if (modifiedCount === 0) {
      logger.warn({ addonId: id }, "Addon not found after update");
      return;
    }

    const updatedAddon = await this.getAddon(id);

    await this.eventService.emit(
      ADDON_UPDATED_EVENT_TYPE,
      {
        addon: updatedAddon!,
        update: updateObj,
      } satisfies AddonUpdatedPayload,
      source,
    );

    logger.debug({ addonId: id, name: update.name }, "Addon updated");
  }

  public async deleteAddon(
    id: string,
    source: EventSource,
  ): Promise<AppointmentAddon | null> {
    const logger = this.loggerFactory("deleteAddon");
    logger.debug({ id }, "Deleting addon");
    const db = await getDbConnection();

    const addons = db.collection<AppointmentAddon>(ADDONS_COLLECTION_NAME);

    const addon = await addons.findOneAndDelete({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!addon) {
      logger.warn({ addonId: id }, "Addon not found");
      return null;
    }

    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);

    const { modifiedCount: optionsModifiedCount } = await options.updateMany(
      {
        organizationId: this.organizationId,
      },
      {
        $pull: {
          addons: {
            id,
          },
        },
      },
    );

    logger.debug({ addonId: id, optionsModifiedCount }, "Addon deleted");

    await this.eventService.emit(
      ADDON_DELETED_EVENT_TYPE,
      {
        addonIds: [id],
      } satisfies AddonDeletedPayload,
      source,
    );

    return addon;
  }

  public async deleteAddons(ids: string[], source: EventSource): Promise<void> {
    const logger = this.loggerFactory("deleteAddons");
    logger.debug({ ids }, "Deleting addons");
    const db = await getDbConnection();
    const addons = db.collection<AppointmentAddon>(ADDONS_COLLECTION_NAME);

    const { deletedCount: addonsDeletedCount } = await addons.deleteMany({
      _id: {
        $in: ids,
      },
      organizationId: this.organizationId,
    });

    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);
    const { modifiedCount: optionsModifiedCount } = await options.updateMany(
      { organizationId: this.organizationId },
      {
        $pull: {
          addons: {
            id: {
              $in: ids,
            },
          },
        },
      },
    );

    await this.eventService.emit(
      ADDON_DELETED_EVENT_TYPE,
      {
        addonIds: ids,
      } satisfies AddonDeletedPayload,
      source,
    );

    logger.debug(
      { addonsDeletedCount, optionsModifiedCount },
      "Addons deleted",
    );
  }

  public async checkAddonUniqueName(
    name: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkAddonUniqueName");
    logger.debug({ name, id }, "Checking addon unique name");
    const db = await getDbConnection();
    const addons = db.collection<AppointmentAddon>(ADDONS_COLLECTION_NAME);

    const filter: Filter<AppointmentAddon> = {
      name,
      organizationId: this.organizationId,
    };

    if (id) {
      filter._id = {
        $ne: id,
      };
    }

    const hasNext = await addons.aggregate([{ $match: filter }]).hasNext();
    logger.debug({ name, id, hasNext }, "Addon unique name check result");
    return !hasNext;
  }

  /** Options */

  public async getOption(id: string): Promise<AppointmentOption | null> {
    const logger = this.loggerFactory("getOption");
    logger.debug({ id }, "Getting option");
    const db = await getDbConnection();
    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);

    const option = await options.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!option) {
      logger.warn({ optionId: id }, "Option not found");
    } else {
      logger.debug({ optionId: id, name: option.name }, "Option found");
    }

    return option;
  }

  public async getOptions(
    query: Query & { priorityIds?: string[] },
  ): Promise<WithTotal<AppointmentOption>> {
    const logger = this.loggerFactory("getOptions");
    logger.debug({ query }, "Getting options");
    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { updatedAt: -1 };

    const filter: Filter<AppointmentOption> = {
      organizationId: this.organizationId,
    };

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<AppointmentOption>(
        { $regex },
        "name",
        "duration",
        "price",
        "description",
      );

      filter.$or = queries;
    }

    const priorityStages = query.priorityIds
      ? [
          {
            $facet: {
              priority: [
                {
                  $match: {
                    _id: {
                      $in: query.priorityIds,
                    },
                    organizationId: this.organizationId,
                  },
                },
              ],
              other: [
                {
                  $match: {
                    ...filter,
                    _id: {
                      $nin: query.priorityIds,
                    },
                  },
                },
                {
                  $sort: sort,
                },
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
          {
            $unwind: {
              path: "$values",
            },
          },
          {
            $replaceRoot: {
              newRoot: "$values",
            },
          },
        ]
      : [
          {
            $match: filter,
          },
          {
            $sort: sort,
          },
        ];

    const [result] = await db
      .collection<AppointmentOption>(OPTIONS_COLLECTION_NAME)
      .aggregate([
        ...priorityStages,
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

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.debug(
      {
        query,
        result: { total: response.total, count: response.items.length },
      },
      "Fetched options",
    );

    return response;
  }

  public async createOption(
    addon: AppointmentOptionUpdateModel,
    source: EventSource,
  ): Promise<AppointmentOption> {
    const logger = this.loggerFactory("createOption");
    logger.debug({ addon }, "Creating option");
    await this.assertFreeTierServiceLimit();
    const dbOption: AppointmentOption = {
      ...addon,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      updatedAt: DateTime.utc().toJSDate(),
    };

    if (!this.checkOptionUniqueName(addon.name)) {
      throw new Error("Name already exists");
    }

    const db = await getDbConnection();
    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);

    await options.insertOne(dbOption);

    await this.eventService.emit(
      APPOINTMENT_OPTION_CREATED_EVENT_TYPE,
      {
        option: dbOption,
      } satisfies AppointmentOptionCreatedPayload,
      source,
    );

    logger.debug(
      { optionId: dbOption._id, name: dbOption.name },
      "Option created",
    );

    return dbOption;
  }

  public async updateOption(
    id: string,
    update: AppointmentOptionUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updateOption");
    logger.debug({ id, update }, "Updating option");
    const db = await getDbConnection();
    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);

    const { _id, organizationId, ...updateObj } = update as AppointmentOption; // Remove fields in case it slips here

    if (!this.checkOptionUniqueName(update.name, id)) {
      throw new Error("Name already exists");
    }

    updateObj.updatedAt = DateTime.utc().toJSDate();

    const { modifiedCount } = await options.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    if (modifiedCount === 0) {
      logger.warn({ optionId: id }, "Option not found after update");
      return;
    }

    const updatedOption = await this.getOption(id);

    await this.eventService.emit(
      APPOINTMENT_OPTION_UPDATED_EVENT_TYPE,
      {
        option: updatedOption!,
        update: updateObj,
      } satisfies AppointmentOptionUpdatedPayload,
      source,
    );

    logger.debug({ optionId: id, name: update.name }, "Option updated");
  }

  public async deleteOption(
    id: string,
    source: EventSource,
  ): Promise<AppointmentOption | null> {
    const logger = this.loggerFactory("deleteOption");
    logger.debug({ id }, "Deleting option");
    const db = await getDbConnection();
    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);

    const option = await options.findOneAndDelete({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!option) {
      logger.warn({ optionId: id }, "Option not found");
      return null;
    }

    const bookingConfiguration =
      await this.configurationService.getConfiguration<"booking">("booking");
    const catalogOptionIds = flattenCatalogOptionIds(
      bookingConfiguration?.catalog,
    );
    if (catalogOptionIds.includes(id)) {
      logger.debug({ optionId: id }, "Option found in booking catalog");

      const remainingIds = catalogOptionIds.filter(
        (optionId) => optionId !== id,
      );
      await this.configurationService.setConfiguration(
        "booking",
        {
          ...bookingConfiguration,
          catalog: filterCatalogNodes(bookingConfiguration.catalog, {
            optionIds: remainingIds,
          }),
        },
        source,
      );

      logger.debug({ optionId: id }, "Booking catalog updated");
    }

    await this.eventService.emit(
      APPOINTMENT_OPTION_DELETED_EVENT_TYPE,
      {
        optionIds: [id],
      } satisfies AppointmentOptionDeletedPayload,
      source,
    );

    logger.debug({ optionId: id }, "Option deleted");

    return option;
  }

  public async deleteOptions(
    ids: string[],
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("deleteOptions");
    logger.debug({ ids }, "Deleting options");
    const db = await getDbConnection();

    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);

    const { deletedCount: optionsDeletedCount } = await options.deleteMany({
      _id: {
        $in: ids,
      },
      organizationId: this.organizationId,
    });

    const bookingConfiguration =
      await this.configurationService.getConfiguration<"booking">("booking");
    const catalogOptionIds = flattenCatalogOptionIds(
      bookingConfiguration?.catalog,
    );
    if (catalogOptionIds.some((optionId) => ids.includes(optionId))) {
      logger.debug({ ids }, "Options found in booking catalog");
      const remainingIds = catalogOptionIds.filter(
        (optionId) => !ids.includes(optionId),
      );

      await this.configurationService.setConfiguration(
        "booking",
        {
          ...bookingConfiguration,
          catalog: filterCatalogNodes(bookingConfiguration.catalog, {
            optionIds: remainingIds,
          }),
        },
        source,
      );

      logger.debug({ ids }, "Booking catalog updated");
    }

    await this.eventService.emit(
      APPOINTMENT_OPTION_DELETED_EVENT_TYPE,
      {
        optionIds: ids,
      } satisfies AppointmentOptionDeletedPayload,
      source,
    );

    logger.debug({ optionsDeletedCount }, "Options deleted");
  }

  public async checkOptionUniqueName(
    name: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkOptionUniqueName");
    logger.debug({ name, id }, "Checking option unique name");
    const db = await getDbConnection();
    const options = db.collection<AppointmentOption>(OPTIONS_COLLECTION_NAME);

    const filter: Filter<AppointmentOption> = {
      name,
      organizationId: this.organizationId,
    };

    if (id) {
      filter._id = {
        $ne: id,
      };
    }

    const hasNext = await options.aggregate([{ $match: filter }]).hasNext();
    logger.debug({ name, id, hasNext }, "Option unique name check result");
    return !hasNext;
  }

  /** Discounts */

  public async getDiscount(id: string): Promise<Discount | null> {
    const logger = this.loggerFactory("getDiscount");
    logger.debug({ id }, "Getting discount");
    const db = await getDbConnection();
    const discounts = db.collection<Discount>(DISCOUNTS_COLLECTION_NAME);

    const result = await discounts.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!result) {
      logger.warn({ discountId: id }, "Discount not found");
    } else {
      logger.debug({ discountId: id, name: result.name }, "Discount found");
    }

    return result;
  }

  public async getDiscountByCode(code: string): Promise<Discount | null> {
    const logger = this.loggerFactory("getDiscountByCode");
    logger.debug({ code }, "Getting discount by code");
    const db = await getDbConnection();
    const discounts = db.collection<Discount>(DISCOUNTS_COLLECTION_NAME);

    const result = await discounts.findOne({
      codes: code,
      organizationId: this.organizationId,
    });

    if (!result) {
      logger.warn({ discountCode: code }, "Discount not found");
    } else {
      logger.debug({ discountCode: code, name: result.name }, "Discount found");
    }

    return result;
  }

  public async getDiscounts(
    query: Query & {
      enabled?: boolean[];
      type?: DiscountType[];
      range?: DateRange;
      priorityIds?: string[];
    },
  ): Promise<
    WithTotal<
      Discount & {
        usedCount: number;
      }
    >
  > {
    const logger = this.loggerFactory("getDiscounts");
    logger.debug({ query }, "Getting discounts");
    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { updatedAt: -1 };

    const $and: Filter<Discount>[] = [
      {
        organizationId: this.organizationId,
      },
    ];

    if (query.type) {
      $and.push({
        type: {
          $in: query.type,
        },
      });
    }

    if (query.range?.start || query.range?.end) {
      if (query.range.start) {
        $and.push({
          $or: [
            {
              endDate: { $gte: query.range.start },
            },
            {
              endDate: { $exists: false },
            },
          ],
        });
      }

      if (query.range.end) {
        $and.push({
          $or: [
            {
              startDate: { $lte: query.range.end },
            },
            {
              startDate: { $exists: false },
            },
          ],
        });
      }
    }

    if (query.enabled?.length === 1) {
      $and.push({
        enabled: query.enabled[0],
      });
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<Discount>({ $regex }, "name", "codes");

      $and.push({
        $or: queries,
      });
    }

    const filter: Filter<Discount> = {
      $and,
    };

    const priorityStages = query.priorityIds
      ? [
          {
            $facet: {
              priority: [
                {
                  $match: {
                    _id: {
                      $in: query.priorityIds,
                    },
                    organizationId: this.organizationId,
                  },
                },
              ],
              other: [
                {
                  $match: {
                    ...filter,
                    _id: {
                      $nin: query.priorityIds,
                    },
                  },
                },
                {
                  $sort: sort,
                },
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
          {
            $unwind: {
              path: "$values",
            },
          },
          {
            $replaceRoot: {
              newRoot: "$values",
            },
          },
        ]
      : [
          {
            $match: filter,
          },
          {
            $sort: sort,
          },
        ];

    const [result] = await db
      .collection<Discount>(DISCOUNTS_COLLECTION_NAME)
      .aggregate([
        {
          $lookup: {
            from: APPOINTMENTS_COLLECTION_NAME,
            localField: "_id",
            foreignField: "discount.id",
            as: "usedCount",
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
          $set: {
            usedCount: {
              $size: "$usedCount",
            },
          },
        },
        ...priorityStages,
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

    const response = {
      total: result.totalCount?.[0]?.count || 0,
      items: result.paginatedResults || [],
    };

    logger.debug(
      {
        query,
        result: { total: response.total, count: response.items.length },
      },
      "Fetched discounts",
    );

    return response;
  }

  public async createDiscount(
    discount: DiscountUpdateModel,
    source: EventSource,
  ): Promise<Discount> {
    const logger = this.loggerFactory("createDiscount");
    logger.debug({ discount }, "Creating discount");
    const dbDiscount: Discount = {
      ...discount,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      updatedAt: DateTime.utc().toJSDate(),
    };

    if (!this.checkDiscountUniqueNameAndCode(discount.name, discount.codes)) {
      logger.error({ discount }, "Discount name or code already exists");
      throw new Error("Name or code already exists");
    }

    const db = await getDbConnection();
    const discounts = db.collection<Discount>(DISCOUNTS_COLLECTION_NAME);

    await discounts.insertOne(dbDiscount);

    await this.eventService.emit(
      DISCOUNT_CREATED_EVENT_TYPE,
      {
        discount: dbDiscount,
      } satisfies DiscountCreatedPayload,
      source,
    );

    logger.debug(
      { discountId: dbDiscount._id, name: dbDiscount.name },
      "Discount created",
    );

    return dbDiscount;
  }

  public async updateDiscount(
    id: string,
    update: DiscountUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updateDiscount");
    logger.debug({ id, update }, "Updating discount");
    const db = await getDbConnection();
    const discounts = db.collection<Discount>(DISCOUNTS_COLLECTION_NAME);

    const { _id, organizationId, ...updateObj } = update as Discount; // Remove fields in case it slips here

    if (!this.checkDiscountUniqueNameAndCode(update.name, update.codes, id)) {
      logger.error(
        { discount: update },
        "Discount name or code already exists",
      );
      throw new Error("Name or code already exists");
    }

    updateObj.updatedAt = DateTime.utc().toJSDate();

    const { modifiedCount } = await discounts.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    if (modifiedCount === 0) {
      logger.warn({ discountId: id }, "Discount not found after update");
      return;
    }

    const updatedDiscount = await this.getDiscount(id);

    await this.eventService.emit(
      DISCOUNT_UPDATED_EVENT_TYPE,
      {
        discount: updatedDiscount!,
        update: updateObj,
      } satisfies DiscountUpdatedPayload,
      source,
    );

    logger.debug({ discountId: id, name: update.name }, "Discount updated");
  }

  public async deleteDiscount(
    id: string,
    source: EventSource,
  ): Promise<Discount | null> {
    const logger = this.loggerFactory("deleteDiscount");
    logger.debug({ id }, "Deleting discount");
    const db = await getDbConnection();

    const discounts = db.collection<Discount>(DISCOUNTS_COLLECTION_NAME);

    const discount = await discounts.findOneAndDelete({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!discount) {
      logger.warn({ discountId: id }, "Discount not found");
      return null;
    }

    await this.eventService.emit(
      DISCOUNT_DELETED_EVENT_TYPE,
      {
        discountIds: [id],
      } satisfies DiscountDeletedPayload,
      source,
    );

    logger.debug({ discountId: id }, "Discount deleted");

    return discount;
  }

  public async deleteDiscounts(
    ids: string[],
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("deleteDiscounts");
    logger.debug({ ids }, "Deleting discounts");
    const db = await getDbConnection();

    const discounts = db.collection<Discount>(DISCOUNTS_COLLECTION_NAME);

    const { deletedCount: discountsDeletedCount } = await discounts.deleteMany({
      _id: {
        $in: ids,
      },
      organizationId: this.organizationId,
    });

    await this.eventService.emit(
      DISCOUNT_DELETED_EVENT_TYPE,
      {
        discountIds: ids,
      } satisfies DiscountDeletedPayload,
      source,
    );

    logger.debug({ ids, discountsDeletedCount }, "Discounts deleted");
  }

  public async checkDiscountUniqueNameAndCode(
    name?: string,
    codes?: string[],
    id?: string,
  ): Promise<{ name: boolean; code: Record<string, boolean> }> {
    const logger = this.loggerFactory("checkDiscountUniqueNameAndCode");
    logger.debug({ name, codes, id }, "Checking discount unique name and code");

    const db = await getDbConnection();
    const discounts = db.collection<Discount>(DISCOUNTS_COLLECTION_NAME);

    const nameFilter: Filter<Discount> = {
      name,
      organizationId: this.organizationId,
    };

    const codeFilter: Filter<Discount> = {
      organizationId: this.organizationId,
    };

    if (id) {
      nameFilter._id = {
        $ne: id,
      };
      codeFilter._id = {
        $ne: id,
      };
    }

    const codesAgg = codes?.length
      ? discounts.aggregate([
          {
            $facet: codes.reduce(
              (map, code) => ({
                ...map,
                [code]: [
                  {
                    $match: {
                      ...codeFilter,
                      code,
                    },
                  },
                  {
                    $count: "count",
                  },
                ],
              }),
              {},
            ),
          },
        ])
      : { toArray: () => Promise.resolve([]) };

    const [nameResult, codeResult] = await Promise.all([
      discounts.find(nameFilter).hasNext(),
      codesAgg.toArray(),
    ]);

    const result = {
      name: !nameResult,
      code: codeResult?.length
        ? Object.entries(codeResult[0]).reduce(
            (map, [code, val]) => ({
              ...map,
              [code]: !val[0]?.count,
            }),
            {},
          )
        : {},
    };

    logger.debug(
      { name, codes, id, result },
      "Discount unique name and code check result",
    );

    return result;
  }

  public async applyDiscount(
    request: ApplyCustomerDiscountRequest,
  ): Promise<Discount | null> {
    const logger = this.loggerFactory("applyDiscount");
    logger.debug({ request }, "Applying discount");
    const discount = await this.getDiscountByCode(request.code);
    if (!discount) {
      logger.debug({ request }, "Discount not found");
      return null;
    }

    const { timeZone } =
      await this.configurationService.getConfiguration("general");

    const now = DateTime.now().setZone(timeZone);

    if (
      discount.startDate &&
      DateTime.fromJSDate(discount.startDate).setZone(timeZone) > now
    ) {
      logger.debug(
        { request, discount },
        "Discount start date is in the future",
      );
      return null;
    }

    if (
      discount.endDate &&
      DateTime.fromJSDate(discount.endDate).setZone(timeZone) < now
    ) {
      logger.debug({ request, discount }, "Discount end date is in the past");
      return null;
    }

    if (
      discount.appointmentStartDate &&
      DateTime.fromJSDate(discount.appointmentStartDate).setZone(timeZone) >
        DateTime.fromJSDate(request.dateTime).setZone(timeZone)
    ) {
      logger.debug(
        { request, discount },
        "Discount appointment start date is in the future",
      );
      return null;
    }

    if (
      discount.appointmentEndDate &&
      DateTime.fromJSDate(discount.appointmentEndDate).setZone(timeZone) <
        DateTime.fromJSDate(request.dateTime).setZone(timeZone)
    ) {
      logger.debug(
        { request, discount },
        "Discount appointment end date is in the past",
      );
      return null;
    }

    if (discount.limitTo?.length) {
      const hasAny = discount.limitTo.some((limit) => {
        const hasPackageLimits = !!limit.packages?.length;
        const hasServiceLimits =
          !!limit.options?.length || !!limit.addons?.length;

        // Package purchases only match package limits (or unrestricted cards).
        // Service/option limits must not apply just because a package contains
        // that service.
        if (request.packageId) {
          if (hasPackageLimits) {
            const matchesPackage = limit.packages!.some(
              (pkg) => pkg.id === request.packageId,
            );
            if (!matchesPackage) {
              logger.debug(
                { request, discount },
                "Discount limit to package not found",
              );
            }
            return matchesPackage;
          }

          if (hasServiceLimits) {
            logger.debug(
              { request, discount },
              "Discount limited to services cannot apply to package purchase",
            );
            return false;
          }

          return true;
        }

        // Service bookings only match option/addon limits (or unrestricted).
        if (hasServiceLimits) {
          if (
            limit.options?.length &&
            !limit.options.some((o) => o.id === request.optionId)
          ) {
            logger.debug(
              { request, discount },
              "Discount limit to option not found",
            );
            return false;
          }

          if (limit.addons?.length) {
            const hasAddonIntersection = limit.addons.some((bundle) =>
              bundle.ids.every(({ id: bId }) =>
                request.addons?.some((aId) => aId === bId),
              ),
            );

            if (!hasAddonIntersection) {
              logger.debug(
                { request, discount },
                "Discount limit to addon not found",
              );
              return false;
            }
          }

          return true;
        }

        if (hasPackageLimits) {
          logger.debug(
            { request, discount },
            "Discount limited to packages cannot apply to service booking",
          );
          return false;
        }

        return true;
      });

      if (!hasAny) {
        logger.debug({ request, discount }, "Discount limit to not found");
        return null;
      }
    }

    const db = await getDbConnection();
    const appointments = db.collection<AppointmentEntity>(
      APPOINTMENTS_COLLECTION_NAME,
    );

    if (discount.maxUsage) {
      const usage = await appointments.countDocuments({
        "discount.id": discount._id,
        organizationId: this.organizationId,
        status: {
          $in: ["confirmed", "pending"],
        },
      });

      if (usage >= discount.maxUsage) {
        logger.debug({ request, discount }, "Discount max usage reached");
        return null;
      }
    }

    if (discount.maxUsagePerCustomer && request.customerId) {
      const usage = await appointments.countDocuments({
        "discount.id": discount._id,
        customerId: request.customerId,
        organizationId: this.organizationId,
        status: {
          $in: ["confirmed", "pending"],
        },
      });

      if (usage >= discount.maxUsagePerCustomer) {
        logger.debug(
          { request, discount },
          "Discount max usage per customer reached",
        );
        return null;
      }
    }

    logger.debug({ request, discount }, "Discount applied");
    return discount;
  }

  public async hasActiveDiscounts(date: Date): Promise<boolean> {
    const logger = this.loggerFactory("hasActiveDiscounts");
    logger.debug({ date }, "Checking for active discounts");
    const db = await getDbConnection();
    const discounts = db.collection<Discount>(DISCOUNTS_COLLECTION_NAME);

    const { timeZone } =
      await this.configurationService.getConfiguration("general");

    const dt = DateTime.fromJSDate(date).setZone(timeZone).toJSDate();

    const hasNext = await discounts
      .aggregate([
        {
          $match: {
            $and: [
              {
                enabled: true,
                organizationId: this.organizationId,
              },
              {
                $or: [
                  {
                    startDate: { $lt: dt },
                  },
                  {
                    startDate: { $exists: false },
                  },
                ],
              },
              {
                $or: [
                  {
                    endDate: { $gt: dt },
                  },
                  {
                    endDate: { $exists: false },
                  },
                ],
              },
            ],
          },
        },
      ])
      .hasNext();

    logger.debug({ date, hasNext }, "Active discounts check result");
    return hasNext;
  }
}
