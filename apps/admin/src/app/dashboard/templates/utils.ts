import { getServicesContainer } from "@/app/utils";
import { BuiltInTemplateTemplates } from "@/components/admin/templates/templates";
import { resolveLanguageFromMap } from "@hacado/i18n";
import { getLoggerFactory } from "@hacado/logger";
import {
  CommunicationChannel,
  ICommunicationTemplatesProvider,
  TemplateTemplatesList,
  TemplatesTemplate,
} from "@hacado/types";

export const getAllTemplates = async (
  type: CommunicationChannel,
  language: string,
) => {
  const logger = getLoggerFactory("AdminAPI/templates/utils")(
    "getAllTemplates",
  );
  logger.debug({ type, language }, "Getting communication templates");

  const servicesContainer = await getServicesContainer();
  const communicationTemplates =
    await servicesContainer.connectedAppsService.invokeAppsByScope<
      ICommunicationTemplatesProvider,
      TemplateTemplatesList
    >("communication-templates-provider", async (app, service) => {
      return await service.getCommunicationTemplates(app.data);
    });

  logger.debug({ communicationTemplates }, "Communication templates retrieved");

  const allTemplates = Object.values(
    [BuiltInTemplateTemplates, ...communicationTemplates.filter((val) => !!val)]
      .flatMap((val) => Object.entries(val))
      .flatMap(([id, templates]) => {
        const template = resolveLanguageFromMap(templates, language);
        if (!template || template.type !== type) {
          return [];
        }

        return [{ id, template }];
      })
      .reduce(
        (acc, curr) => {
          return {
            ...acc,
            [curr.id]: curr,
          };
        },
        {} as Record<string, { id: string; template: TemplatesTemplate }>,
      ),
  );

  logger.debug({ allTemplates }, "All templates retrieved");
  return allTemplates;
};
