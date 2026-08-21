import PageContainer from "@/components/admin/layout/page-container";
import { PackageForm } from "@/components/admin/services/packages/form";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { Metadata } from "next/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("services.packages.new"),
  };
}

export default async function NewPackagePage() {
  const t = await getI18nAsync("admin");
  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.packages"),
      link: "/dashboard/services/packages",
    },
    {
      title: t("services.packages.new"),
      link: "/dashboard/services/packages/new",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("services.packages.newTitle")}
            description={t("services.packages.newDescription")}
          />
        </div>
        <PackageForm />
      </div>
    </PageContainer>
  );
}
