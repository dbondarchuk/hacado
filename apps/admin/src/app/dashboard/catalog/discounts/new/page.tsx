import { getServicesContainer } from "@/app/utils";
import { DiscountForm } from "@/components/admin/catalog/discounts/form";
import PageContainer from "@/components/admin/layout/page-container";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { DiscountUpdateModel } from "@hacado/types/booking";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Heading } from "@hacado/ui/heading";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";

type Props = PageProps<"/dashboard/catalog/discounts/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.discounts.new"),
  };
}

export default async function NewDiscountPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("new-service-discount");
  const t = await getI18nAsync("admin");
  await assertPageHasPermission("discount", "create");
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
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    {
      title: t("navigation.discounts"),
      link: "/dashboard/catalog/discounts",
    },
    {
      title: t("catalog.discounts.new"),
      link: "/dashboard/catalog/discounts/new",
    },
  ];

  let initialData: DiscountUpdateModel | undefined = undefined;
  if (from) {
    const servicesContainer = await getServicesContainer();
    const result = await servicesContainer.catalogService.getDiscount(from);
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
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("catalog.discounts.newTitle")}
            description={t("catalog.discounts.newDescription")}
          />
        </div>
        <DiscountForm initialData={initialData} />
      </div>
    </PageContainer>
  );
}
