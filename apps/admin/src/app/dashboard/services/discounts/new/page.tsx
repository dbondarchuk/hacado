import { getServicesContainer } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { DiscountForm } from "@/components/admin/services/discounts/form";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { DiscountUpdateModel } from "@hacado/types";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";

type Props = PageProps<"/dashboard/services/discounts/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.discounts.new"),
  };
}

export default async function NewDiscountPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("new-service-discount");
  const t = await getI18nAsync("admin");
  const { from: fromParam } = await props.searchParams;
  const from = fromParam as string;

  logger.debug(
    {
      fromDiscountId: from,
    },
    "Loading new service discount page",
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.discounts"),
      link: "/dashboard/services/discounts",
    },
    {
      title: t("services.discounts.new"),
      link: "/dashboard/services/discounts/new",
    },
  ];

  let initialData: DiscountUpdateModel | undefined = undefined;
  if (from) {
    const servicesContainer = await getServicesContainer();
    const result = await servicesContainer.servicesService.getDiscount(from);
    if (!result) {
      logger.warn(
        { fromDiscountId: from },
        "Source discount not found for copying",
      );
      notFound();
    }

    const { _id, updatedAt, ...field } = result;
    initialData = field;

    logger.debug(
      {
        fromDiscountId: from,
        discountName: result.name,
      },
      "Using source discount as template",
    );
  }

  logger.debug(
    {
      fromDiscountId: from,
      hasInitialData: !!initialData,
    },
    "New service discount page loaded",
  );

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("services.discounts.newTitle")}
            description={t("services.discounts.newDescription")}
          />
        </div>
        <DiscountForm initialData={initialData} />
      </div>
    </PageContainer>
  );
}
