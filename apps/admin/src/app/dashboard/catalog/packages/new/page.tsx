import { PackageForm } from "@/components/admin/catalog/packages/form";
import PageContainer from "@/components/admin/layout/page-container";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Heading } from "@hacado/ui/heading";
import { Metadata } from "next/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.packages.new"),
  };
}

export default async function NewPackagePage() {
  const t = await getI18nAsync("admin");
  await assertPageHasPermission("package", "create");
  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    {
      title: t("navigation.packages"),
      link: "/dashboard/catalog/packages",
    },
    {
      title: t("catalog.packages.new"),
      link: "/dashboard/catalog/packages/new",
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("catalog.packages.newTitle")}
            description={t("catalog.packages.newDescription")}
          />
        </div>
        <PackageForm />
      </div>
    </PageContainer>
  );
}
