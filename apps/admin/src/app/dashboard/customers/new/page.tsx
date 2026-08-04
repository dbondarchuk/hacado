import { CustomerForm } from "@/components/admin/customers/form";
import PageContainer from "@/components/admin/layout/page-container";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@timelish/i18n/server";
import { getLoggerFactory } from "@timelish/logger";
import { Breadcrumbs, Heading } from "@timelish/ui";
import { Metadata } from "next";

type Props = PageProps<"/dashboard/customers/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("customers.new"),
  };
}

export default async function NewCustomerPage(props: Props) {
  await assertPageHasPermission("customer", "create");
  const logger = getLoggerFactory("AdminPages")("new-customer");
  const t = await getI18nAsync("admin");
  const searchParams = await props.searchParams;

  logger.debug(
    {
      from: searchParams.from,
    },
    "Loading new customer page",
  );

  const breadcrumbItems = [
    { title: t("assets.dashboard"), link: "/dashboard" },
    { title: t("customers.title"), link: "/dashboard/customers" },
    { title: t("customers.new"), link: "/dashboard/customers/new" },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("customers.new")}
            description={t("customers.addNewCustomer")}
          />
          {/* <Separator /> */}
        </div>
        <CustomerForm />
      </div>
    </PageContainer>
  );
}
