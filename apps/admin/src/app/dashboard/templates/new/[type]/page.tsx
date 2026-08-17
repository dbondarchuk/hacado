import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { CommunicationChannel } from "@hacado/types";
import { Heading, Skeleton } from "@hacado/ui";
import { Metadata } from "next";
import { Suspense } from "react";
import { TemplateFormPage } from "../../form-page";

type Props = PageProps<"/dashboard/templates/new/[type]">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { type } = await props.params;
  return {
    title: t("templates.newPage.title", {
      type: t(
        `common.labels.channel.${type as string as CommunicationChannel}`,
      ).toLowerCase(),
    }),
  };
}

export default async function NewTemplatePage({ params, searchParams }: Props) {
  const logger = getLoggerFactory("AdminPages")("new-template");
  const t = await getI18nAsync("admin");
  const { type: typeParam } = await params;
  const type = typeParam as string as CommunicationChannel;
  const { templateId: templateParam } = await searchParams;
  const templateId = templateParam as string;

  const { cloneFrom: cloneFromParam } = await searchParams;
  const cloneFrom = cloneFromParam as string;

  logger.debug(
    {
      type,
      templateId,
      cloneFrom,
    },
    "Loading new template page",
  );

  logger.debug(
    {
      type,
      templateId,
      cloneFrom,
    },
    "New template page loaded",
  );

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full h-full">
        <div className="flex flex-col gap-4 justify-between">
          <Heading
            title={t("templates.newPage.title", {
              type: t(`common.labels.channel.${type}`).toLowerCase(),
            })}
          />
        </div>
        <Suspense fallback={<Skeleton className="w-full h-full" />}>
          <TemplateFormPage
            type={type}
            templateId={templateId}
            cloneFromId={cloneFrom}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}
