import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Skeleton } from "@hacado/ui/skeleton";
import { Metadata } from "next";
import { Suspense } from "react";
import { getTemplate } from "../cached";
import { TemplateFormPage } from "../form-page";

type Props = PageProps<"/dashboard/templates/[id]">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const template = await getTemplate(id);
  return {
    title: `${template?.name} | ${t("templates.editPage.title")}`,
  };
}

export default async function UpdateTemplatePage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("edit-template");
  const { id } = await props.params;

  logger.debug(
    {
      templateId: id,
    },
    "Loading template edit page",
  );

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full h-full">
        <Suspense fallback={<Skeleton className="w-full h-full" />}>
          <TemplateFormPage id={id} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
