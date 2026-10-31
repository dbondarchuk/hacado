import { getServicesContainer } from "@/app/utils";
import { PackageForm } from "@/components/admin/catalog/packages/form";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { Heading } from "@hacado/ui/heading";
import { notFound } from "next/navigation";
import { Metadata } from "next/types";
import { cache } from "react";

type Props = PageProps<"/dashboard/catalog/packages/[id]">;

const getPackage = cache(async (id: string) => {
  const servicesContainer = await getServicesContainer();
  return servicesContainer.packagesService.getPackage(id);
});

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const pkg = await getPackage(id);
  return {
    title: `${pkg?.name ?? ""} | ${t("catalog.packages.title")}`,
  };
}

export default async function EditPackagePage(props: Props) {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const pkg = await getPackage(id);
  if (!pkg) notFound();

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    { title: t("navigation.catalog"), link: "/dashboard/catalog" },
    {
      title: t("navigation.packages"),
      link: "/dashboard/catalog/packages",
    },
    {
      title: pkg.name,
      link: `/dashboard/catalog/packages/${id}`,
    },
  ];

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={pkg.name}
            description={t("catalog.packages.editDescription")}
          />
        </div>
        <PackageForm initialData={pkg} />
      </div>
    </PageContainer>
  );
}
