import {
  BillingPlanTier,
  FREE_TIER_LIMITS,
  IEventService,
  IOrganizationService,
  IPagesService,
  PAGE_CREATED_EVENT_TYPE,
  PAGE_DELETED_EVENT_TYPE,
  PAGE_FOOTER_CREATED_EVENT_TYPE,
  PAGE_FOOTER_DELETED_EVENT_TYPE,
  PAGE_FOOTER_UPDATED_EVENT_TYPE,
  PAGE_HEADER_CREATED_EVENT_TYPE,
  PAGE_HEADER_DELETED_EVENT_TYPE,
  PAGE_HEADER_UPDATED_EVENT_TYPE,
  PAGE_UPDATED_EVENT_TYPE,
  Page,
  PageFooter,
  PageFooterListModel,
  PageFooterUpdateModel,
  PageHeader,
  PageHeaderListModel,
  PageHeaderUpdateModel,
  PageLimitReachedError,
  PageListModel,
  PageMatchResult,
  PageUpdateModel,
  Query,
  WithTotal,
  type EventSource,
  type PageCreatedPayload,
  type PageDeletedPayload,
  type PageFooterCreatedPayload,
  type PageFooterDeletedPayload,
  type PageFooterUpdatedPayload,
  type PageHeaderCreatedPayload,
  type PageHeaderDeletedPayload,
  type PageHeaderUpdatedPayload,
  type PageUpdatedPayload,
} from "@hacado/types";
import { buildSearchQuery, escapeRegex } from "@hacado/utils";
import { DateTime } from "luxon";
import { Filter, ObjectId, Sort } from "mongodb";
import { resolvePlanTierFromOrganization } from "./billing/subscription-entitlements";
import {
  PAGES_COLLECTION_NAME,
  PAGE_FOOTERS_COLLECTION_NAME,
  PAGE_HEADERS_COLLECTION_NAME,
} from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

export type PageRouteEntry = Pick<Page, "_id" | "slug" | "title">;

export type PageRouteMatch = {
  entry: PageRouteEntry;
  params: Record<string, string>;
};

export class PagesService extends BaseService implements IPagesService {
  public constructor(
    organizationId: string,
    protected readonly eventService: IEventService,
    private readonly organizationService: IOrganizationService,
  ) {
    super("PagesService", organizationId);
  }

  private async assertFreeTierPageLimit(): Promise<void> {
    const organization = await this.organizationService.getOrganization();
    const planTier = resolvePlanTierFromOrganization(organization);
    if (planTier !== BillingPlanTier.Free) {
      return;
    }

    const db = await getDbConnection();
    const count = await db
      .collection<Page>(PAGES_COLLECTION_NAME)
      .countDocuments({ organizationId: this.organizationId });

    if (count >= FREE_TIER_LIMITS.pages) {
      throw new PageLimitReachedError(FREE_TIER_LIMITS.pages);
    }
  }

  public async getPage(id: string): Promise<Page | null> {
    const logger = this.loggerFactory("getPage");
    logger.debug({ pageId: id }, "Getting page by id");

    const db = await getDbConnection();
    const pages = db.collection<Page>(PAGES_COLLECTION_NAME);

    const page = await pages.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!page) {
      logger.warn({ pageId: id }, "Page not found");
    } else {
      logger.debug(
        {
          pageId: id,
          title: page.title,
          slug: page.slug,
          published: page.published,
        },
        "Page found",
      );
    }

    return page;
  }

  protected normalizePageSlug(rawSlug: string): string {
    return rawSlug.replace(/^\/+|\/+$/g, "");
  }

  protected matchPageRoute(
    entries: PageRouteEntry[],
    rawSlug: string,
  ): PageRouteMatch | null {
    const logger = this.loggerFactory("matchPageRoute");
    const slug = this.normalizePageSlug(rawSlug);
    const slugParts = slug.split("/");

    // 1. Try exact match
    const exact = entries.find((entry) => entry.slug === slug);
    if (exact) {
      logger.debug(
        {
          rawSlug,
          pageSlug: exact.slug,
          pageId: exact._id,
          pageTitle: exact.title,
        },
        "Exact match found",
      );
      return { entry: exact, params: {} };
    }

    // 2. Match dynamic patterns
    const matches: PageRouteMatch[] = [];

    for (const entry of entries) {
      logger.debug(
        {
          rawSlug,
          pageSlug: entry.slug,
          pageId: entry._id,
          pageTitle: entry.title,
        },
        "Checking page",
      );
      if (!entry.slug.includes("[")) continue;

      const patternParts = entry.slug.split("/");
      logger.debug({ rawSlug, patternParts }, "Pattern parts");
      if (patternParts.length !== slugParts.length) {
        logger.debug(
          { rawSlug, patternParts, slugParts },
          "Pattern parts length mismatch",
        );
        continue;
      }

      const params: Record<string, string> = {};
      let match = true;

      for (let i = 0; i < patternParts.length; i++) {
        const patternSegment = patternParts[i];
        const slugSegment = slugParts[i];

        if (/^\[.+\]$/.test(patternSegment)) {
          params[patternSegment.slice(1, -1)] = slugSegment;
        } else if (patternSegment !== slugSegment) {
          logger.debug(
            { rawSlug, patternSegment, slugSegment },
            "Pattern segment mismatch",
          );
          match = false;
          break;
        }

        logger.debug(
          { rawSlug, patternSegment, slugSegment, match },
          "Pattern segment match",
        );
      }

      if (match) {
        logger.debug({ rawSlug, params }, "Match found");
        matches.push({ entry, params });
      }
    }

    if (matches.length === 0) {
      logger.debug({ rawSlug }, "No matches found");
      return null;
    }

    // 3. Choose the most specific (fewest [param] segments)
    matches.sort((a, b) => {
      const countDynamic = (pageSlug: string) =>
        pageSlug.split("/").filter((segment) => /^\[.+\]$/.test(segment))
          .length;

      return countDynamic(a.entry.slug) - countDynamic(b.entry.slug);
    });

    logger.debug(
      { rawSlug, pageSlug: matches[0]?.entry.slug },
      "Page match result",
    );
    return matches[0];
  }

  protected async fetchPageRouteEntries(): Promise<PageRouteEntry[]> {
    const logger = this.loggerFactory("fetchPageRouteEntries");
    logger.debug(
      { organizationId: this.organizationId },
      "Fetching page route entries from database",
    );

    const db = await getDbConnection();
    const pages = db.collection<Page>(PAGES_COLLECTION_NAME);

    const entries = await pages
      .find(
        { organizationId: this.organizationId },
        { projection: { _id: 1, slug: 1, title: 1 } },
      )
      .toArray();

    logger.debug({ count: entries.length }, "Fetched page route entries");

    return entries;
  }

  public async resolvePage(rawSlug: string): Promise<PageMatchResult | null> {
    const logger = this.loggerFactory("resolvePage");
    logger.debug({ rawSlug }, "Resolving page");

    const entries = await this.fetchPageRouteEntries();
    const match = this.matchPageRoute(entries, rawSlug);
    if (!match) {
      return null;
    }

    const page = await this.getPage(match.entry._id);
    if (!page) {
      logger.warn(
        { rawSlug, pageId: match.entry._id },
        "Matched page not found in database",
      );
      return null;
    }

    return { page, params: match.params };
  }

  public async getPageBySlug(slug: string): Promise<Page | null> {
    const logger = this.loggerFactory("getPageBySlug");
    logger.debug({ slug }, "Getting page by slug");

    const db = await getDbConnection();
    const pages = db.collection<Page>(PAGES_COLLECTION_NAME);

    const page = await pages.findOne({
      slug,
      organizationId: this.organizationId,
    });

    if (!page) {
      logger.warn({ slug }, "Page not found by slug");
    } else {
      logger.debug(
        {
          slug,
          pageId: page._id,
          title: page.title,
          published: page.published,
        },
        "Page found by slug",
      );
    }

    return page;
  }

  public async getPages(
    query: Query & {
      publishStatus?: boolean[];
      maxPublishDate?: Date;
      tags?: string[];
      priorityIds?: string[];
    },
  ): Promise<WithTotal<PageListModel>> {
    const logger = this.loggerFactory("getPages");
    logger.debug({ query }, "Getting pages");

    const db = await getDbConnection();

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { updatedAt: -1 };

    const filter: Filter<Page> = {
      organizationId: this.organizationId,
    };

    if (query.publishStatus) {
      filter.published = {
        $in: query.publishStatus,
      };
    }

    if (query.maxPublishDate) {
      filter.publishDate = {
        $lte: query.maxPublishDate,
      };
    }

    if (query.tags) {
      filter.tags = {
        $all: query.tags,
      };
    }

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<Page>(
        { $regex },
        "slug",
        "keywords",
        "title",
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
      .collection<Page>(PAGES_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            organizationId: this.organizationId,
          },
        },
        ...priorityStages,
        {
          $project: {
            content: 0,
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
      "Fetched pages",
    );

    return response;
  }

  public async createPage(
    page: PageUpdateModel,
    source: EventSource,
  ): Promise<Page> {
    const logger = this.loggerFactory("createPage");
    logger.debug(
      { page: { slug: page.slug, title: page.title } },
      "Creating new page",
    );

    await this.assertFreeTierPageLimit();

    const dbPage: Page = {
      ...page,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      updatedAt: DateTime.utc().toJSDate(),
      createdAt: DateTime.utc().toJSDate(),
    };

    if (!this.checkUniqueSlug(page.slug)) {
      logger.error({ slug: page.slug }, "Slug already exists");
      throw new Error("Slug already exists");
    }

    const db = await getDbConnection();
    const pages = db.collection<Page>(PAGES_COLLECTION_NAME);

    await pages.insertOne(dbPage);

    await this.eventService.emit(
      PAGE_CREATED_EVENT_TYPE,
      { page: dbPage } satisfies PageCreatedPayload,
      source,
    );

    logger.debug(
      { pageId: dbPage._id, slug: dbPage.slug },
      "Successfully created page",
    );

    return dbPage;
  }

  public async updatePage(
    id: string,
    update: PageUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updatePage");
    logger.debug(
      { pageId: id, update: { slug: update.slug, title: update.title } },
      "Updating page",
    );

    const db = await getDbConnection();
    const pages = db.collection<Page>(PAGES_COLLECTION_NAME);

    const { _id, organizationId, ...updateObj } = update as Page; // Remove fields in case it slips here

    if (!this.checkUniqueSlug(update.slug, id)) {
      logger.error({ pageId: id, slug: update.slug }, "Slug already exists");
      throw new Error("Slug already exists");
    }

    updateObj.updatedAt = DateTime.utc().toJSDate();

    await pages.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    const page = await this.getPage(id);
    if (page) {
      await this.eventService.emit(
        PAGE_UPDATED_EVENT_TYPE,
        { page } satisfies PageUpdatedPayload,
        source,
      );
    }

    logger.debug({ pageId: id }, "Successfully updated page");
  }

  public async deletePage(
    id: string,
    source: EventSource,
  ): Promise<Page | null> {
    const logger = this.loggerFactory("deletePage");
    logger.debug({ pageId: id }, "Deleting page");

    const db = await getDbConnection();
    const pages = db.collection<Page>(PAGES_COLLECTION_NAME);

    const page = await pages.findOne({ _id: id });
    if (!page) {
      logger.warn({ pageId: id }, "Page not found for deletion");
      return null;
    }
    if (page.slug === "home") {
      logger.error({ pageId: id, slug: page.slug }, "Cannot delete home page");
      throw new Error("Can not delete home page");
    }

    await pages.deleteOne({
      _id: id,
      organizationId: this.organizationId,
    });

    logger.debug({ pageId: id, slug: page.slug }, "Successfully deleted page");

    await this.eventService.emit(
      PAGE_DELETED_EVENT_TYPE,
      { pageIds: [id] } satisfies PageDeletedPayload,
      source,
    );

    return page;
  }

  public async deletePages(ids: string[], source: EventSource): Promise<void> {
    const logger = this.loggerFactory("deletePages");
    logger.debug({ pageIds: ids }, "Deleting multiple pages");

    const db = await getDbConnection();
    const pages = db.collection<Page>(PAGES_COLLECTION_NAME);

    const homePage = await pages.findOne({
      _id: {
        $in: ids,
      },
      slug: "home",
      organizationId: this.organizationId,
    });

    if (homePage) {
      logger.error({ pageIds: ids }, "Cannot delete home page");
      throw new Error("Can not delete home page");
    }

    const { deletedCount } = await pages.deleteMany({
      _id: {
        $in: ids,
      },
      organizationId: this.organizationId,
    });

    logger.debug(
      { pageIds: ids, count: deletedCount },
      "Successfully deleted multiple pages",
    );

    if (ids.length) {
      await this.eventService.emit(
        PAGE_DELETED_EVENT_TYPE,
        { pageIds: ids } satisfies PageDeletedPayload,
        source,
      );
    }
  }

  public async checkUniqueSlug(slug: string, id?: string): Promise<boolean> {
    const logger = this.loggerFactory("checkUniqueSlug");
    logger.debug({ slug, id }, "Checking unique slug");
    const db = await getDbConnection();
    const pages = db.collection<Page>(PAGES_COLLECTION_NAME);

    const filter: Filter<Page> = {
      slug,
      organizationId: this.organizationId,
    };

    if (id) {
      filter._id = {
        $ne: id,
      };
    }

    const hasNext = await pages.aggregate([{ $match: filter }]).hasNext();

    logger.debug({ slug, id, hasNext }, "Slug check result");
    return !hasNext;
  }

  /** Page Headers */

  public async getPageHeader(id: string): Promise<PageHeader | null> {
    const logger = this.loggerFactory("getPageHeader");
    logger.debug({ pageHeaderId: id }, "Getting page header by id");

    const db = await getDbConnection();
    const pageHeaders = db.collection<PageHeader>(PAGE_HEADERS_COLLECTION_NAME);

    const pageHeader = await pageHeaders.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!pageHeader) {
      logger.warn({ pageHeaderId: id }, "Page header not found");
    } else {
      logger.debug(
        { pageHeaderId: id, name: pageHeader.name },
        "Page header found",
      );
    }

    return pageHeader;
  }

  public async getPageHeaders(
    query: Query & { priorityIds?: string[] },
  ): Promise<WithTotal<PageHeaderListModel>> {
    const logger = this.loggerFactory("getPageHeaders");
    logger.debug({ query }, "Getting page headers");

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { updatedAt: -1 };

    const db = await getDbConnection();

    const filter: Filter<PageHeader> = {};
    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<PageHeader>({ $regex }, "name");

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
      .collection<PageHeader>(PAGE_HEADERS_COLLECTION_NAME)
      .aggregate([
        {
          $project: {
            menu: 0,
          },
        },
        {
          $match: {
            organizationId: this.organizationId,
          },
        },
        {
          $lookup: {
            from: PAGES_COLLECTION_NAME,
            localField: "_id",
            foreignField: "headerId",
            as: "usedCount",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                },
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$usedCount",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            usedCount: {
              $ifNull: ["$usedCount.count", 0],
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
      "Fetched page headers",
    );

    return response;
  }

  public async createPageHeader(
    pageHeader: PageHeaderUpdateModel,
    source: EventSource,
  ): Promise<PageHeader> {
    const logger = this.loggerFactory("createPageHeader");
    logger.debug(
      { pageHeader: { name: pageHeader.name } },
      "Creating new page header",
    );

    const dbPageHeader: PageHeader = {
      ...pageHeader,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      updatedAt: DateTime.utc().toJSDate(),
    };

    const db = await getDbConnection();
    const pageHeaders = db.collection<PageHeader>(PAGE_HEADERS_COLLECTION_NAME);

    await pageHeaders.insertOne(dbPageHeader);

    await this.eventService.emit(
      PAGE_HEADER_CREATED_EVENT_TYPE,
      { pageHeader: dbPageHeader } satisfies PageHeaderCreatedPayload,
      source,
    );

    logger.debug(
      { pageHeaderId: dbPageHeader._id, name: dbPageHeader.name },
      "Successfully created page header",
    );

    return dbPageHeader;
  }

  public async updatePageHeader(
    id: string,
    update: PageHeaderUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updatePageHeader");
    logger.debug(
      { pageHeaderId: id, update: { name: update.name } },
      "Updating page header",
    );

    const db = await getDbConnection();
    const pageHeaders = db.collection<PageHeader>(PAGE_HEADERS_COLLECTION_NAME);

    const { _id, organizationId, ...updateObj } = update as PageHeader; // Remove fields in case it slips here

    updateObj.updatedAt = DateTime.utc().toJSDate();

    await pageHeaders.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    const pageHeader = await this.getPageHeader(id);
    if (pageHeader) {
      await this.eventService.emit(
        PAGE_HEADER_UPDATED_EVENT_TYPE,
        { pageHeader } satisfies PageHeaderUpdatedPayload,
        source,
      );
    }

    logger.debug({ pageHeaderId: id }, "Successfully updated page header");
  }

  public async deletePageHeader(
    id: string,
    source: EventSource,
  ): Promise<PageHeader | null> {
    const logger = this.loggerFactory("deletePageHeader");
    logger.debug({ pageHeaderId: id }, "Deleting page header");

    const db = await getDbConnection();
    const pageHeaders = db.collection<PageHeader>(PAGE_HEADERS_COLLECTION_NAME);

    const pageHeader = await pageHeaders.findOneAndDelete({
      _id: id,
      organizationId: this.organizationId,
    });
    if (!pageHeader) {
      logger.warn({ pageHeaderId: id }, "Page header not found for deletion");
      return null;
    }

    logger.debug({ pageHeaderId: id }, "Successfully deleted page header");

    if (pageHeader) {
      await this.eventService.emit(
        PAGE_HEADER_DELETED_EVENT_TYPE,
        { pageHeaderIds: [id] } satisfies PageHeaderDeletedPayload,
        source,
      );
    }

    return pageHeader;
  }

  public async deletePageHeaders(
    ids: string[],
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("deletePageHeaders");
    logger.debug({ pageHeaderIds: ids }, "Deleting multiple page headers");

    const db = await getDbConnection();
    const pageHeaders = db.collection<PageHeader>(PAGE_HEADERS_COLLECTION_NAME);

    const { deletedCount } = await pageHeaders.deleteMany({
      _id: {
        $in: ids,
      },
      organizationId: this.organizationId,
    });

    logger.debug(
      { pageHeaderIds: ids, count: deletedCount },
      "Successfully deleted multiple page headers",
    );

    if (ids.length) {
      await this.eventService.emit(
        PAGE_HEADER_DELETED_EVENT_TYPE,
        { pageHeaderIds: ids } satisfies PageHeaderDeletedPayload,
        source,
      );
    }
  }

  public async checkUniquePageHeaderName(
    name: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkUniquePageHeaderName");
    logger.debug({ name, id }, "Checking unique page header name");
    const db = await getDbConnection();
    const pageHeaders = db.collection<PageHeader>(PAGE_HEADERS_COLLECTION_NAME);

    const filter: Filter<PageHeader> = {
      name,
      organizationId: this.organizationId,
    };

    if (id) {
      filter._id = {
        $ne: id,
      };
    }

    const hasNext = await pageHeaders.aggregate([{ $match: filter }]).hasNext();

    logger.debug({ name, id, hasNext }, "Name check result");
    return !hasNext;
  }

  /** Page Footers */

  public async getPageFooter(id: string): Promise<PageFooter | null> {
    const logger = this.loggerFactory("getPageFooter");
    logger.debug({ pageFooterId: id }, "Getting page footer by id");

    const db = await getDbConnection();
    const pageFooters = db.collection<PageFooter>(PAGE_FOOTERS_COLLECTION_NAME);

    const pageFooter = await pageFooters.findOne({
      _id: id,
      organizationId: this.organizationId,
    });

    if (!pageFooter) {
      logger.warn({ pageFooterId: id }, "Page footer not found");
    } else {
      logger.debug(
        { pageFooterId: id, name: pageFooter.name },
        "Page footer found",
      );
    }

    return pageFooter;
  }

  public async getPageFooters(
    query: Query & { priorityIds?: string[] },
  ): Promise<WithTotal<PageFooterListModel>> {
    const logger = this.loggerFactory("getPageFooters");
    logger.debug({ query }, "Getting page footers");

    const sort: Sort = query.sort?.reduce(
      (prev, curr) => ({
        ...prev,
        [curr.id]: curr.desc ? -1 : 1,
      }),
      {},
    ) || { updatedAt: -1 };

    const db = await getDbConnection();

    const filter: Filter<PageFooter> = {
      organizationId: this.organizationId,
    };

    if (query.search) {
      const $regex = new RegExp(escapeRegex(query.search), "i");
      const queries = buildSearchQuery<PageFooter>({ $regex }, "name");

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
      .collection<PageFooter>(PAGE_FOOTERS_COLLECTION_NAME)
      .aggregate([
        {
          $project: {
            content: 0,
          },
        },
        {
          $match: {
            organizationId: this.organizationId,
          },
        },
        {
          $lookup: {
            from: PAGES_COLLECTION_NAME,
            localField: "_id",
            foreignField: "footerId",
            as: "usedCount",
            pipeline: [
              {
                $match: {
                  organizationId: this.organizationId,
                },
              },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$usedCount",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            usedCount: {
              $ifNull: ["$usedCount.count", 0],
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
      "Fetched page footers",
    );

    return response;
  }

  public async createPageFooter(
    pageFooter: PageFooterUpdateModel,
    source: EventSource,
  ): Promise<PageFooter> {
    const logger = this.loggerFactory("createPageFooter");
    logger.debug(
      { pageFooter: { name: pageFooter.name } },
      "Creating new page footer",
    );

    const dbPageFooter: PageFooter = {
      ...pageFooter,
      organizationId: this.organizationId,
      _id: new ObjectId().toString(),
      updatedAt: DateTime.utc().toJSDate(),
    };

    const db = await getDbConnection();
    const pageFooters = db.collection<PageFooter>(PAGE_FOOTERS_COLLECTION_NAME);

    await pageFooters.insertOne(dbPageFooter);

    await this.eventService.emit(
      PAGE_FOOTER_CREATED_EVENT_TYPE,
      { pageFooter: dbPageFooter } satisfies PageFooterCreatedPayload,
      source,
    );

    logger.debug(
      { pageFooterId: dbPageFooter._id, name: dbPageFooter.name },
      "Successfully created page footer",
    );

    return dbPageFooter;
  }

  public async updatePageFooter(
    id: string,
    update: PageFooterUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updatePageFooter");
    logger.debug(
      {
        pageFooterId: id,
        update: { name: update.name },
        organizationId: this.organizationId,
      },
      "Updating page footer",
    );

    const db = await getDbConnection();
    const pageFooters = db.collection<PageFooter>(PAGE_FOOTERS_COLLECTION_NAME);

    const { _id, organizationId, ...updateObj } = update as PageFooter; // Remove fields in case it slips here

    updateObj.updatedAt = DateTime.utc().toJSDate();

    await pageFooters.updateOne(
      {
        _id: id,
        organizationId: this.organizationId,
      },
      {
        $set: updateObj,
      },
    );

    const pageFooter = await this.getPageFooter(id);
    if (pageFooter) {
      await this.eventService.emit(
        PAGE_FOOTER_UPDATED_EVENT_TYPE,
        { pageFooter } satisfies PageFooterUpdatedPayload,
        source,
      );
    }

    logger.debug({ pageFooterId: id }, "Successfully updated page footer");
  }

  public async deletePageFooter(
    id: string,
    source: EventSource,
  ): Promise<PageFooter | null> {
    const logger = this.loggerFactory("deletePageFooter");
    logger.debug({ pageFooterId: id }, "Deleting page footer");

    const db = await getDbConnection();
    const pageFooters = db.collection<PageFooter>(PAGE_FOOTERS_COLLECTION_NAME);

    const pageFooter = await pageFooters.findOneAndDelete({
      _id: id,
      organizationId: this.organizationId,
    });
    if (!pageFooter) {
      logger.warn({ pageFooterId: id }, "Page footer not found for deletion");
      return null;
    }

    logger.debug({ pageFooterId: id }, "Successfully deleted page footer");

    if (pageFooter) {
      await this.eventService.emit(
        PAGE_FOOTER_DELETED_EVENT_TYPE,
        { pageFooterIds: [id] } satisfies PageFooterDeletedPayload,
        source,
      );
    }

    return pageFooter;
  }

  public async deletePageFooters(
    ids: string[],
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("deletePageFooters");
    logger.debug({ pageFooterIds: ids }, "Deleting multiple page footers");

    const db = await getDbConnection();
    const pageFooters = db.collection<PageFooter>(PAGE_FOOTERS_COLLECTION_NAME);

    const { deletedCount } = await pageFooters.deleteMany({
      _id: {
        $in: ids,
      },
      organizationId: this.organizationId,
    });

    logger.debug(
      { pageFooterIds: ids, count: deletedCount },
      "Successfully deleted multiple page footers",
    );

    if (ids.length) {
      await this.eventService.emit(
        PAGE_FOOTER_DELETED_EVENT_TYPE,
        { pageFooterIds: ids } satisfies PageFooterDeletedPayload,
        source,
      );
    }
  }

  public async checkUniquePageFooterName(
    name: string,
    id?: string,
  ): Promise<boolean> {
    const logger = this.loggerFactory("checkUniquePageFooterName");
    logger.debug({ name, id }, "Checking unique page footer name");
    const db = await getDbConnection();
    const pageFooters = db.collection<PageFooter>(PAGE_FOOTERS_COLLECTION_NAME);

    const filter: Filter<PageFooter> = {
      name,
      organizationId: this.organizationId,
    };

    if (id) {
      filter._id = {
        $ne: id,
      };
    }

    const hasNext = await pageFooters.aggregate([{ $match: filter }]).hasNext();

    logger.debug({ name, id, hasNext }, "Name check result");
    return !hasNext;
  }
}
