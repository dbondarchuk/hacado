import { getServicesContainer, getWebsiteUrl } from "@/app/utils";
import { TemplateForm } from "@/components/admin/templates/form";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  CommunicationChannel,
  DemoArguments,
  IDemoArgumentsProvider,
  Template,
  TemplatesTemplate,
} from "@hacado/types";
import { Breadcrumbs } from "@hacado/ui";
import { demoAppointment, getAdminUrl, getArguments } from "@hacado/utils";
import { notFound } from "next/navigation";
import React from "react";
import { getTemplate } from "./cached";
import { getAllTemplates } from "./utils";

export const TemplateFormPage: React.FC<
  | ({
      type: CommunicationChannel;
    } & (
      | {
          templateId: string;
        }
      | {
          cloneFromId: string;
        }
    ))
  | {
      id: string;
    }
> = async (props) => {
  const t = await getI18nAsync("admin");
  const servicesContainer = await getServicesContainer();
  const adminUrl = getAdminUrl();
  const websiteUrl = await getWebsiteUrl();
  const config = await servicesContainer.configurationService.getConfigurations(
    "booking",
    "general",
    "brand",
    "social",
  );

  const demoEmailArgumentsArray =
    await servicesContainer.connectedAppsService.invokeAppsByScope<
      IDemoArgumentsProvider,
      DemoArguments
    >("demo-arguments-provider", async (app, service) => {
      return (await service.getDemoEmailArguments?.(app.data)) ?? {};
    });

  const demoEmailArguments = demoEmailArgumentsArray
    .filter((val) => !!val)
    .reduce((acc, curr) => {
      return { ...acc, ...curr };
    }, {});

  const demoArguments = getArguments({
    appointment: demoAppointment,
    config,
    adminUrl,
    websiteUrl,
    customer: demoAppointment.customer,
    locale: config.brand.language,
    additionalProperties: demoEmailArguments,
  });

  let initialData: Template | undefined;
  let type: CommunicationChannel;
  let template: TemplatesTemplate | undefined;
  if ("id" in props && props.id) {
    const data = await getTemplate(props.id);
    if (!data) {
      notFound();
    }

    initialData = data;
    type = data.type;
  } else if ("cloneFromId" in props && props.cloneFromId) {
    const data = await getTemplate(props.cloneFromId);
    if (!data) {
      notFound();
    }

    type = data.type;
    template = data;
  } else {
    type = "type" in props ? (props.type ?? "email") : "email";
    if ("templateId" in props && props.templateId) {
      const locale = config.brand.language;
      const allTemplates = await getAllTemplates(type, locale);

      const possibleTemplate = allTemplates.find(
        (template) => template.id === props.templateId,
      )?.template;
      if (!possibleTemplate) {
        notFound();
      }

      template = possibleTemplate;
    }
  }

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.communications"),
      link: "/dashboard/communication-logs",
    },
    { title: t("navigation.templates"), link: "/dashboard/templates" },
    {
      title: t(`common.labels.channel.${type}`),
      link: `/dashboard/templates?type=${encodeURIComponent(type)}`,
    },
  ];

  if (initialData) {
    breadcrumbItems.push({
      title: initialData.name,
      link: `/dashboard/templates/${type}/${initialData._id}`,
    });
  } else {
    breadcrumbItems.push({
      title: t("templates.formPage.new"),
      link: `/dashboard/templates/${type}/new`,
    });
  }

  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      {initialData ? (
        <TemplateForm args={demoArguments} initialData={initialData} />
      ) : (
        <TemplateForm args={demoArguments} type={type} template={template} />
      )}
    </>
  );
};
