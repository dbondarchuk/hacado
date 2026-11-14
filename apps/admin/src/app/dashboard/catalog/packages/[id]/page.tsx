import { getServicesContainer } from "@/app/utils";
import { PackageForm } from "@/components/admin/catalog/packages/form";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
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
  const { id } = await props.params;
  const pkg = await getPackage(id);
  if (!pkg) notFound();

  return (
    <PageContainer scrollable>
      <PackageForm initialData={pkg} />
    </PageContainer>
  );
}
