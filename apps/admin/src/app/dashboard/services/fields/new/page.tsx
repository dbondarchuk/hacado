import { getServicesContainer } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { ServiceFieldForm } from "@/components/admin/services/fields/form";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { ServiceFieldUpdateModel } from "@hacado/types";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";

type Props = PageProps<"/dashboard/services/fields/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.fields.new"),
  };
}

export default async function NewServicePage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("new-service-field");
  const t = await getI18nAsync("admin");
  await assertPageHasPermission("service", "create");
  const { from: fromParam } = await props.searchParams;
  const from = fromParam as string;

  logger.debug(
    {
      fromFieldId: from,
    },
    "Loading new service field page",
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    { title: t("navigation.fields"), link: "/dashboard/services/fields" },
    {
      title: t("services.fields.new"),
      link: "/dashboard/services/fields/new",
    },
  ];

  let initialData: ServiceFieldUpdateModel | undefined = undefined;
  if (from) {
    const servicesContainer = await getServicesContainer();
    const result = await servicesContainer.servicesService.getField(from);
    if (!result) {
      logger.warn({ fromFieldId: from }, "Source field not found for copying");
      notFound();
    }

    const { _id, updatedAt, ...field } = result;
    initialData = field;

    logger.debug(
      {
        fromFieldId: from,
        fieldName: result.name,
        fieldType: result.type,
      },
      "Using source field as template",
    );
  }

  logger.debug(
    {
      fromFieldId: from,
      hasInitialData: !!initialData,
    },
    "New service field page loaded",
  );

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("services.fields.newTitle")}
            description={t("services.fields.newDescription")}
          />
          {/* <Separator /> */}
        </div>
        <ServiceFieldForm initialData={initialData} />
      </div>
    </PageContainer>
  );
}
