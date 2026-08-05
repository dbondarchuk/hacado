import {
  CommunicationChannel,
  IEventService,
  ITemplatesService,
  Query,
  TEMPLATE_CREATED_EVENT_TYPE,
  TEMPLATE_DELETED_EVENT_TYPE,
  TEMPLATE_UPDATED_EVENT_TYPE,
  Template,
  TemplateListModel,
  TemplateUpdateModel,
  WithTotal,
  type EventSource,
  type TemplateCreatedPayload,
  type TemplateDeletedPayload,
  type TemplateUpdatedPayload,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { DateTime } from "luxon";
import { Filter, ObjectId, Sort } from "mongodb";
import { TEMPLATES_COLLECTION_NAME } from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

export class TemplatesService extends BaseService implements ITemplatesService {
  constructor(
    organizationId: string,
    protected readonly eventService: IEventService,
  ) {
    super("TemplatesService", organizationId);
  }

  public async getTemplate(_id: string): Promise<Template | null> {
    const logger = this.loggerFactory("getTemplate");
    logger.debug({ _id }, "Getting template");
    const db = await getDbConnection();
    const templates = db.collection<Template>(TEMPLATES_COLLECTION_NAME);

    const template = await templates.findOne({
      _id,
      organizationId: this.organizationId,
    });

    logger.debug({ _id, template }, "Template found");

    return template;
  }

  public async getTemplates(
    query: Query & {
      type?: CommunicationChannel[];
    },
  ): Promise<WithTotal<TemplateListModel>> {
    const logger = this.loggerFactory("getTemplates");
    logger.debug({ query }, "Getting templates");
    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { updatedAt: -1 };

    const filter: Filter<Template> = {
      organizationId: this.organizationId,
    };

    if (query.type) {
      filter.type = {
        $in: query.type,
      };
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<Template>({ $regex }, "name");

      filter.$or = queries;
    }

    const [result] = await db
      .collection<Template>(TEMPLATES_COLLECTION_NAME)
      .aggregate([
        {
          $match: filter,
        },
        {
          $sort: sort,
        },
        {
          $project: {
            value: false,
          },
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
      "Templates fetched",
    );

    return response;
  }

  public async createTemplate(
    template: TemplateUpdateModel,
    source: EventSource,
  ): Promise<Template> {
    const logger = this.loggerFactory("createTemplate");
    logger.debug({ template }, "Creating template");
    const dbTemplate: Template = {
      ...template,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      updatedAt: DateTime.utc().toJSDate(),
    };

    if (!this.checkUniqueName(template.name)) {
      throw new Error("Name already exists");
    }

    const db = await getDbConnection();
    const templates = db.collection<Template>(TEMPLATES_COLLECTION_NAME);

    await templates.insertOne(dbTemplate);

    await this.eventService.emit(
      TEMPLATE_CREATED_EVENT_TYPE,
      { template: dbTemplate } satisfies TemplateCreatedPayload,
      source,
    );

    logger.debug(
      { templateId: dbTemplate._id, name: dbTemplate.name },
      "Template created",
    );

    return dbTemplate;
  }

  public async updateTemplate(
    id: string,
    update: TemplateUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updateTemplate");
    logger.debug(
      { id, update: { type: update.type, name: update.name } },
      "Updating template",
    );
    const db = await getDbConnection();
    const templates = db.collection<Template>(TEMPLATES_COLLECTION_NAME);

    const { _id, organizationId, ...updateObj } = update as Template; // Remove fields in case it slips here

    if (!this.checkUniqueName(update.name, id)) {
      logger.error(
        { id, update: { type: update.type, name: update.name } },
        "Template name already exists",
      );
      throw new Error("Name already exists");
    }

    updateObj.updatedAt = DateTime.utc().toJSDate();

    await templates.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    const template = await this.getTemplate(id);
    if (template) {
      await this.eventService.emit(
        TEMPLATE_UPDATED_EVENT_TYPE,
        { template } satisfies TemplateUpdatedPayload,
        source,
      );
    }

    logger.debug({ id, update }, "Template updated");
  }

  public async deleteTemplate(
    id: string,
    source: EventSource,
  ): Promise<Template | null> {
    const logger = this.loggerFactory("deleteTemplate");
    logger.debug({ id }, "Deleting template");
    const db = await getDbConnection();
    const templates = db.collection<Template>(TEMPLATES_COLLECTION_NAME);

    const template = await templates.findOneAndDelete({
      _id: id,
      organizationId: this.organizationId,
    });

    logger.debug({ id, templateDeleted: !!template }, "Template delete result");

    if (template) {
      await this.eventService.emit(
        TEMPLATE_DELETED_EVENT_TYPE,
        { templateIds: [id] } satisfies TemplateDeletedPayload,
        source,
      );
    }

    return template;
  }

  public async deleteTemplates(
    ids: string[],
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("deleteTemplates");
    logger.debug({ ids }, "Deleting templates");
    const db = await getDbConnection();
    const templates = db.collection<Template>(TEMPLATES_COLLECTION_NAME);

    const { deletedCount } = await templates.deleteMany({
      _id: {
        $in: ids,
      },
      organizationId: this.organizationId,
    });

    logger.debug({ ids, deletedCount }, "Templates deleted");

    if (ids.length) {
      await this.eventService.emit(
        TEMPLATE_DELETED_EVENT_TYPE,
        { templateIds: ids } satisfies TemplateDeletedPayload,
        source,
      );
    }
  }

  public async checkUniqueName(name: string, id?: string): Promise<boolean> {
    const logger = this.loggerFactory("checkUniqueName");
    logger.debug({ name, id }, "Checking template name uniqueness");
    const db = await getDbConnection();
    const templates = db.collection<Template>(TEMPLATES_COLLECTION_NAME);

    const filter: Filter<Template> = {
      name,
      organizationId: this.organizationId,
    };

    if (id) {
      filter._id = {
        $ne: id,
      };
    }

    const hasNext = await templates.aggregate([{ $match: filter }]).hasNext();

    logger.debug(
      { name, id, hasNext },
      "Template name uniqueness check result",
    );

    return !hasNext;
  }
}
