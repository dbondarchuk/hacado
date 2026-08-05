import {
  IEventService,
  IOrganizationService,
  Page,
  PageUpdateModel,
  type EventSource,
} from "@hacado/types";
import type { Redis } from "ioredis";
import { PageRouteEntry, PagesService } from "./pages.service";

export class CachedPagesService extends PagesService {
  private static readonly REDIS_KEY_PREFIX = "org:pages:routes:";
  private static readonly REDIS_TTL_SECONDS = 60 * 60 * 24; // 24 hours

  public constructor(
    organizationId: string,
    eventService: IEventService,
    organizationService: IOrganizationService,
    protected readonly redisClient: Redis,
  ) {
    super(organizationId, eventService, organizationService);
  }

  private getRedisKey(): string {
    return `${CachedPagesService.REDIS_KEY_PREFIX}${this.organizationId}`;
  }

  private async getFromRedisCache(): Promise<PageRouteEntry[] | null> {
    const logger = this.loggerFactory("getFromRedisCache");
    logger.debug("Getting page route table from Redis");

    try {
      const value = await this.redisClient.get(this.getRedisKey());
      if (value === null) {
        return null;
      }

      const entries = JSON.parse(value) as PageRouteEntry[];
      logger.debug({ count: entries.length }, "Page route table retrieved from Redis");
      return entries;
    } catch (error) {
      logger.warn({ error }, "Redis lookup failed");
      return null;
    }
  }

  private async writeRedisCache(entries: PageRouteEntry[]): Promise<void> {
    const logger = this.loggerFactory("writeRedisCache");
    logger.debug({ count: entries.length }, "Writing page route table cache");

    try {
      await this.redisClient.setex(
        this.getRedisKey(),
        CachedPagesService.REDIS_TTL_SECONDS,
        JSON.stringify(entries),
      );
      logger.debug({ count: entries.length }, "Page route table cache written");
    } catch (error) {
      logger.warn({ error }, "Failed to write page route table cache");
    }
  }

  public async invalidateRouteCache(): Promise<void> {
    const logger = this.loggerFactory("invalidateRouteCache");
    logger.debug("Invalidating page route table cache");

    try {
      await this.redisClient.del(this.getRedisKey());
      logger.debug("Page route table cache invalidated");
    } catch (error) {
      logger.warn({ error }, "Failed to invalidate page route table cache");
    }
  }

  protected async fetchPageRouteEntries(): Promise<PageRouteEntry[]> {
    const logger = this.loggerFactory("fetchPageRouteEntries");
    const cached = await this.getFromRedisCache();

    if (cached !== null) {
      logger.debug({ count: cached.length }, "Page route table cache hit");
      return cached;
    }

    logger.debug("Page route table cache miss");
    const entries = await super.fetchPageRouteEntries();
    logger.debug({ count: entries.length }, "Page route entries fetched from database");
    await this.writeRedisCache(entries);
    return entries;
  }

  public async createPage(
    page: PageUpdateModel,
    source: EventSource,
  ): Promise<Page> {
    const logger = this.loggerFactory("createPage");
    const created = await super.createPage(page, source);
    logger.debug({ pageId: created._id, slug: created.slug }, "Invalidating page route cache after create");
    await this.invalidateRouteCache();
    return created;
  }

  public async updatePage(
    id: string,
    update: PageUpdateModel,
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("updatePage");
    await super.updatePage(id, update, source);
    logger.debug({ pageId: id, slug: update.slug }, "Invalidating page route cache after update");
    await this.invalidateRouteCache();
  }

  public async deletePage(
    id: string,
    source: EventSource,
  ): Promise<Page | null> {
    const logger = this.loggerFactory("deletePage");
    const deleted = await super.deletePage(id, source);
    logger.debug({ pageId: id, slug: deleted?.slug }, "Invalidating page route cache after delete");
    await this.invalidateRouteCache();
    return deleted;
  }

  public async deletePages(ids: string[], source: EventSource): Promise<void> {
    const logger = this.loggerFactory("deletePages");
    await super.deletePages(ids, source);
    logger.debug({ pageIds: ids }, "Invalidating page route cache after bulk delete");
    await this.invalidateRouteCache();
  }
}
