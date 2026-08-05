import {
  Configuration,
  ConfigurationKey,
  ConfigurationOption,
  IEventService,
  type EventSource,
} from "@hacado/types";
import type { Redis } from "ioredis";
import { cache } from "react";
import { ConfigurationService } from "./configuration.service";

export class CachedConfigurationService extends ConfigurationService {
  private static readonly REDIS_KEY_PREFIX = "org:config:";
  private static readonly REDIS_TTL_SECONDS = 60 * 60 * 24; // 24 hours

  public constructor(
    organizationId: string,
    eventService: IEventService,
    protected readonly redisClient: Redis,
  ) {
    super(organizationId, eventService);
  }

  private getRedisKey(key: ConfigurationKey): string {
    return `${CachedConfigurationService.REDIS_KEY_PREFIX}${this.organizationId}:${key}`;
  }

  private async getFromRedisCache(
    key: ConfigurationKey,
  ): Promise<string | null> {
    const logger = this.loggerFactory("getFromRedisCache");
    logger.debug({ key }, "Getting configuration cache from Redis");
    try {
      const value = await this.redisClient.get(this.getRedisKey(key));
      logger.debug({ key }, "Configuration cache retrieved from Redis");
      return value;
    } catch (error) {
      logger.warn({ error, key }, "Redis lookup failed");
      return null;
    }
  }

  private async writeRedisCache(
    key: ConfigurationKey,
    value: unknown,
  ): Promise<void> {
    const logger = this.loggerFactory("writeRedisCache");
    logger.debug({ key, value }, "Writing configuration cache");
    try {
      await this.redisClient.setex(
        this.getRedisKey(key),
        CachedConfigurationService.REDIS_TTL_SECONDS,
        JSON.stringify(value),
      );

      logger.debug({ key, value }, "Configuration cache written");
    } catch (error) {
      logger.warn({ error, key }, "Failed to write configuration cache");
    }
  }

  public async invalidateRedisCache(
    ...keys: ConfigurationKey[]
  ): Promise<void> {
    const logger = this.loggerFactory("invalidateRedisCache");
    logger.debug({ keys }, "Invalidating configuration cache");

    if (keys.length === 0) {
      logger.debug({ keys }, "No keys to invalidate");
      return;
    }

    const redisKeys = keys.map((key) => this.getRedisKey(key));

    try {
      logger.debug({ keys }, "Deleting keys from Redis");
      await this.redisClient.del(...redisKeys);
      logger.debug({ keys }, "Keys deleted from Redis");
    } catch (error) {
      logger.warn({ error, keys }, "Failed to invalidate configuration cache");
    }
  }

  private async fetchConfiguration<T extends ConfigurationKey>(
    key: T,
  ): Promise<ConfigurationOption<T>["value"]> {
    const logger = this.loggerFactory("fetchConfiguration");
    const cached = await this.getFromRedisCache(key);

    if (cached !== null) {
      logger.debug({ key }, "Configuration cache hit");
      const parsed = JSON.parse(cached) as ConfigurationOption<T>["value"];
      if (!parsed || Object.keys(parsed).length === 0) {
        logger.debug({ key }, "Configuration cache invalid");
      } else {
        logger.debug({ key }, "Configuration cache valid");
        return parsed;
      }
    } else {
      logger.debug({ key }, "Configuration cache miss");
    }

    const value = await super.getConfiguration(key);
    logger.debug({ key }, "Configuration fetched from database");
    await this.writeRedisCache(key, value);
    logger.debug({ key }, "Configuration cache written");
    return value;
  }

  private cachedGetConfiguration = cache(
    async <T extends ConfigurationKey>(
      key: T,
    ): Promise<ConfigurationOption<T>["value"]> => this.fetchConfiguration(key),
  );

  private cachedGetConfigurations = cache(
    async <K extends ConfigurationKey>(
      ...keys: K[]
    ): Promise<Pick<Configuration, K>> => {
      const entries = await Promise.all(
        keys.map(
          async (key) => [key, await this.cachedGetConfiguration(key)] as const,
        ),
      );
      return Object.fromEntries(entries) as Pick<Configuration, K>;
    },
  );

  public async getConfiguration<T extends ConfigurationKey>(
    key: T,
  ): Promise<ConfigurationOption<T>["value"]> {
    return this.cachedGetConfiguration(key);
  }

  public async getConfigurations<K extends ConfigurationKey>(
    ...keys: K[]
  ): Promise<Pick<Configuration, K>> {
    return this.cachedGetConfigurations(...keys);
  }

  public async setConfiguration<T extends ConfigurationKey>(
    key: T,
    configuration: ConfigurationOption<T>["value"],
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("setConfiguration");
    logger.debug({ key, configuration, source }, "Setting configuration");
    await super.setConfiguration(key, configuration, source);
    logger.debug({ key, configuration, source }, "Configuration set");
    await this.invalidateRedisCache(key);
    logger.debug({ key, configuration, source }, "Configuration invalidated");
    await this.writeRedisCache(key, configuration);
    logger.debug({ key, configuration, source }, "Configuration written");
  }
}
