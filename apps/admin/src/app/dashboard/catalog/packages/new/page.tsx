import { PackageForm } from "@/components/admin/catalog/packages/form";
import PageContainer from "@/components/admin/layout/page-container";
import { assertPageHasPermission } from "@/lib/auth/assert-page-permission";
import { getI18nAsync } from "@hacado/i18n/server";
import { Metadata } from "next/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("catalog.packages.new"),
  };
}

export default async function NewPackagePage() {
  await assertPageHasPermission("package", "create");

  return (
    <PageContainer scrollable>
      <PackageForm />
    </PageContainer>
  );
}
