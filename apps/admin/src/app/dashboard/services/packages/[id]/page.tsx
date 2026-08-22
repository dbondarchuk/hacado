import { getServicesContainer } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { PackageForm } from "@/components/admin/services/packages/form";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs, Heading } from "@hacado/ui";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";
import { cache } from "react";

type Props = PageProps<"/dashboard/services/packages/[id]">;

const getPackage = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return servicesContainer.packagesService.getPackage(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const pkg = await getPackage(id);
  return {
    title: `${pkg?.name ?? ""} | ${t("services.packages.title")}`,
  };
}

export default async function EditPackagePage(props: Props) {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const pkg = await getPackage(id);
  if (!pkg) notFound();

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.services"), link: "/dashboard/services" },
    {
      title: t("navigation.packages"),
      link: "/dashboard/services/packages",
    },
    {
      title: pkg.name,
      link: `/dashboard/services/packages/${id}`,
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={pkg.name}
            description={t("services.packages.editDescription")}
          />
        </div>
        <PackageForm initialData={pkg} />
      </div>
    </PageContainer>
  );
}
