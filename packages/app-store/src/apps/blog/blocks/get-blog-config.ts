import { ServicesContainer } from "@hacado/services/container";
import { BlogConfiguration, blogConfigurationSchema } from "../models";

export const getBlogConfiguration = async (
  organizationId: string,
  appId: string,
): Promise<BlogConfiguration> => {
  const props =
    await ServicesContainer(
      organizationId,
    ).connectedAppsService.getAppServiceProps(appId);
  const app = await props.services.connectedAppsService.getApp(appId);
  return blogConfigurationSchema.parse(app?.data ?? {});
};
