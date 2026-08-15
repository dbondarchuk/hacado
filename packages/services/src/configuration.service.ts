import {
  Configuration,
  ConfigurationKey,
  ConfigurationOption,
  IConfigurationService,
  IEventService,
  SETTINGS_UPDATED_EVENT_TYPE,
  type EventSource,
  type SettingsUpdatedPayload,
} from "@hacado/types";
import { CONFIGURATION_COLLECTION_NAME } from "./collections";
import { getDbConnection } from "./database";
import { BaseService } from "./services/base.service";

export class ConfigurationService
  extends BaseService
  implements IConfigurationService
{
  public constructor(
    organizationId: string,
    protected readonly eventService: IEventService,
  ) {
    super("ConfigurationService", organizationId);
  }

  public async getConfiguration<T extends ConfigurationKey>(
    key: T,
  ): Promise<ConfigurationOption<T>["value"]> {
    const logger = this.loggerFactory("getConfiguration");
    logger.debug({ key }, "Getting configuration");
    const db = await getDbConnection();
    const configurations = db.collection<ConfigurationOption<T>>(
      CONFIGURATION_COLLECTION_NAME,
    );

    const value = await configurations.findOne({
      // @ts-ignore Correct key
      key,
      organizationId: this.organizationId,
    });

    if (!value?.value) {
      logger.error({ key }, "Can't find configuration");
      return {} as ConfigurationOption<T>["value"];
    }

    logger.debug({ key }, "Found configuration");

    return value.value;
  }

  public async getConfigurations<T extends ConfigurationKey>(
    ...keys: T[]
  ): Promise<Pick<Configuration, T>> {
    const logger = this.loggerFactory("getConfigurations");
    logger.debug({ keys }, "Getting configurations");

    const db = await getDbConnection();
    const configurations = db.collection(CONFIGURATION_COLLECTION_NAME);

    const values: ConfigurationOption<T>[] = await configurations
      .find<ConfigurationOption<T>>({
        key: {
          $in: keys,
        },
        organizationId: this.organizationId,
      })
      .toArray();

    if (values.length !== keys.length) {
      logger.error(
        {
          keys,
          foundKeys: values?.map((v) => v.key),
        },
        "Can't find configuration for all keys",
      );
    }

    const result = values.reduce(
      (acc, cur) => ({
        ...acc,
        [cur.key]: cur.value,
      }),
      {} as Pick<Configuration, T>,
    );

    logger.debug({ keys }, "Fetched configurations");
    return result;
  }

  public async setConfiguration<T extends ConfigurationKey>(
    key: T,
    configuration: ConfigurationOption<T>["value"],
    source: EventSource,
  ): Promise<void> {
    const logger = this.loggerFactory("setConfiguration");
    logger.debug({ key }, "Setting configuration");

    const db = await getDbConnection();
    const configurations = db.collection<ConfigurationOption<T>>(
      CONFIGURATION_COLLECTION_NAME,
    );

    const updateResult = await configurations.updateOne(
      {
        // @ts-ignore Correct key
        key,
        organizationId: this.organizationId,
      },
      {
        $set: {
          key,
          organizationId: this.organizationId,
          value: configuration,
        },
      },
      {
        upsert: true,
      },
    );

    logger.debug({ key, updateResult }, "Set configuration");

    await this.eventService.emit(
      SETTINGS_UPDATED_EVENT_TYPE,
      { key } satisfies SettingsUpdatedPayload,
      source,
    );
  }
}
