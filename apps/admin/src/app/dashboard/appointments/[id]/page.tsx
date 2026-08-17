import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { Skeleton } from "@hacado/ui";
import { Metadata } from "next";
import { Suspense } from "react";
import { AppointmentViewWrapper } from "./appointment-view-wrapper";
import { getAppointment } from "./cached";

type Props = PageProps<"/dashboard/appointments/[id]">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  const { id } = await props.params;
  const appointment = await getAppointment(id);
  return {
    title: appointment?.option.name,
    description: t("appointments.detail.by", {
      name: appointment?.fields.name,
    }),
  };
}

export default async function AppointmentPage(props: Props) {
  const logger = getLoggerFactory("AdminPages")("appointment-detail");
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const shouldShowDeclineModal = "decline" in searchParams;

  logger.debug(
    {
      appointmentId: id,
      shouldShowDeclineModal,
    },
    "Loading appointment detail page",
  );

  return (
    <PageContainer scrollable>
      <Suspense
        fallback={
          <div className="flex flex-1 flex-col gap-4 w-full">
            <div className="flex flex-col gap-4 justify-between">
              <div className="flex flex-col gap-2">
                <Skeleton className="w-full max-w-80 h-9" />
                <Skeleton className="w-full max-w-80 h-5" />
              </div>
            </div>
            <Skeleton className="w-full max-h-svh h-full min-h-96" />
          </div>
        }
      >
        <AppointmentViewWrapper
          appointmentId={id}
          shouldShowDeclineModal={shouldShowDeclineModal}
        />
      </Suspense>
    </PageContainer>
  );
}
