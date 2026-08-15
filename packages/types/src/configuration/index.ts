import * as z from "zod";
import { WithOrganizationId } from "../database";
import {
  DefaultAppsConfiguration,
  defaultAppsConfigurationSchema,
} from "./apps";
import { BookingConfiguration, bookingConfigurationSchema } from "./booking";
import { BrandConfiguration, brandConfigurationSchema } from "./brand";
import {
  CustomerAuthConfiguration,
  customerAuthConfigurationSchema,
} from "./customer-auth";
import { GeneralConfiguration, generalConfigurationSchema } from "./general";
import { ScheduleConfiguration, scheduleConfigurationSchema } from "./schedule";
import { ScriptsConfiguration, scriptsConfigurationSchema } from "./scripts";
import { SocialConfiguration, socialConfigurationSchema } from "./social";
import { StylingConfiguration, stylingConfigurationSchema } from "./styling";

export * from "./apps";
export * from "./booking";
export * from "./brand";
export * from "./customer-auth";
export * from "./general";
export * from "./resources";
export * from "./schedule";
export * from "./scripts";
export * from "./social";
export * from "./styling";

export type Configuration = {
  general: GeneralConfiguration;
  brand: BrandConfiguration;
  social: SocialConfiguration;
  booking: BookingConfiguration;
  customerAuth: CustomerAuthConfiguration;
  defaultApps: DefaultAppsConfiguration;
  scripts: ScriptsConfiguration;
  styling: StylingConfiguration;
  schedule: ScheduleConfiguration;
};

export type ConfigurationKey = keyof Configuration;

export type ConfigurationOption<T extends ConfigurationKey> = {
  key: T;
  value: Configuration[T];
};

export type ConfigurationOptionWithOrganizationId<T extends ConfigurationKey> =
  WithOrganizationId<ConfigurationOption<T>>;

export const configurationSchemaMap: Record<
  ConfigurationKey,
  z.ZodSchema<Configuration[ConfigurationKey]>
> = {
  general: generalConfigurationSchema,
  brand: brandConfigurationSchema,
  social: socialConfigurationSchema,
  booking: bookingConfigurationSchema,
  customerAuth: customerAuthConfigurationSchema,
  defaultApps: defaultAppsConfigurationSchema,
  scripts: scriptsConfigurationSchema,
  styling: stylingConfigurationSchema,
  schedule: scheduleConfigurationSchema,
};
