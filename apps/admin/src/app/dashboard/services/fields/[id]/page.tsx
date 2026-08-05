import PageContainer from "@/components/admin/layout/page-container";
import { Breadcrumbs, Heading } from "@hacado/ui";

import { getServicesContainer } from "@/app/utils";
import { ServiceFieldForm } from "@/components/admin/services/fields/form";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";
import { cache } from "react";

type Props = PageProps<"/dashboard/services/fields/[id]">;

const getField = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return await servicesContainer.servicesService.getField(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const field = await getField(id);
  return {
    title: `${field?.name} | ${t("services.fields.title")}`,
  };
}

export default async function EditFieldPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-service-field");
  const t = await getI18nAsync("admin");
  await assertPageHasPermission("service", "update");
  const params = await props.params;

  logger.debug(
    {
      fieldId: params.id,
    },
    "Loading service field edit page",
  );

  const field = await getField(params.id);

  if (!field) {
    logger.warn({ fieldId: params.id }, "Service field not found");
    return notFound();
  }

  logger.debug(
    {
      fieldId: params.id,
      fieldName: field.name,
      fieldType: field.type,
      fieldLabel: field.data.label,
    },
    "Service field edit page loaded",
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    { title: t("navigation.fields"), link: "/dashboard/services/fields" },
    {
      title: field.data.label,
      link: `/dashboard/services/fields/${params.id}`,
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={field.data.label}
            description={t("services.fields.editDescription")}
          />

          {/* <Separator /> */}
        </div>
        <ServiceFieldForm initialData={field} />
      </div>
    </PageContainer>
  );
}
