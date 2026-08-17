import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { OptionForm } from "@/components/admin/services/options/form";
import { ServiceLimitUpgradeHint } from "@/components/admin/services/service-limit-upgrade-hint";
import {
  catalogServiceDescriptionKey,
  catalogServiceNameKey,
  getCatalogProfession,
} from "@/components/install/catalog";
import {
  defaultDurationFromTemplate,
  defaultPriceFromTemplate,
} from "@/components/install/constants";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { sessionCanCreateMoreServices } from "@/lib/billing/subscription-plan-access";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { AppointmentOptionUpdateModel } from "@hacado/types";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";

type Props = PageProps<"/dashboard/services/options/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.options.new"),
  };
}

export default async function NewOptionPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("new-service-option");
  const t = await getI18nAsync("admin");
  const tInstall = await getI18nAsync("install");
  await assertPageHasPermission("service", "create");
  const { from: fromParam, template: templateParam } = await props.searchParams;
  const from = fromParam as string;
  const template = templateParam as string;

  logger.debug(
    {
      fromOptionId: from,
      template,
    },
    "Loading new service option page",
  );

  const session = await getSession();
  const servicesContainer = await getServicesContainer();
  const { total: serviceCount } =
    await servicesContainer.servicesService.getOptions({
      limit: 0,
    });

  const canAddMore = sessionCanCreateMoreServices(session, serviceCount);

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.options"),
      link: "/dashboard/services/options",
    },
    {
      title: t("services.options.new"),
      link: "/dashboard/services/options/new",
    },
  ];

  let initialData: AppointmentOptionUpdateModel | undefined = undefined;
  if (canAddMore && from) {
    const result = await servicesContainer.servicesService.getOption(from);
    if (!result) {
      logger.warn(
        { fromOptionId: from },
        "Source option not found for copying",
      );
      notFound();
    }

    const { _id, updatedAt, ...option } = result;
    initialData = option;

    logger.debug(
      {
        fromOptionId: from,
        optionName: result.name,
      },
      "Using source option as template",
    );
  } else if (canAddMore && template) {
    const [categoryId, professionId, serviceId] = template.split(":");
    const profession = getCatalogProfession(categoryId, professionId);
    const serviceTemplate = profession?.services.find(
      (s) => s.id === serviceId,
    );
    if (!serviceTemplate) {
      logger.warn(
        { template },
        "Template not found for service option creation",
      );
      notFound();
    }

    const name = tInstall(
      catalogServiceNameKey(categoryId, professionId, serviceId) as any,
    ).slice(0, 256);
    const description = tInstall(
      catalogServiceDescriptionKey(categoryId, professionId, serviceId) as any,
    ).slice(0, 1024);

    const defaultPrice = defaultPriceFromTemplate(serviceTemplate.prices ?? []);

    initialData = {
      name,
      description,
      durationType: "fixed",
      duration: defaultDurationFromTemplate(serviceTemplate.durations),
      price: defaultPrice ? Number(defaultPrice) : undefined,
      requireDeposit: "inherit",
      isOnline: false,
      isAutoConfirm: "inherit",
      duplicateAppointmentCheck: {
        enabled: false,
      },
      cancellationPolicy: {
        withDeposit: { type: "inherit" },
        withoutDeposit: { type: "inherit" },
      },
      reschedulePolicy: {
        type: "inherit",
      },
    };

    logger.debug(
      {
        template,
        serviceTemplateId: serviceId,
        optionName: name,
      },
      "Using install service template as initial data",
    );
  }

  logger.debug(
    {
      fromOptionId: from,
      template,
      hasInitialData: !!initialData,
    },
    "New service option page loaded",
  );

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("services.options.newTitle")}
            description={t("services.options.newDescription")}
          />
        </div>
        {canAddMore ? (
          <OptionForm initialData={initialData} />
        ) : (
          <ServiceLimitUpgradeHint />
        )}
      </div>
    </PageContainer>
  );
}
