import { getServicesContainer } from "@/app/utils";

export async function customTextTemplatesAllowed() {
  const services = await getServicesContainer();
  const access =
    await services.textMessageConfigurationService.getSmsMessagingAccess();

  return access.allowCustomTemplates;
}
