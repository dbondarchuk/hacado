import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { AppointmentChoice } from "@hacado/types";
import { Breadcrumbs, Heading } from "@hacado/ui";
import {
  AppointmentScheduleForm,
  AppointmentScheduleFormFrom,
} from "@hacado/ui-admin-kit";
import { canReassignAppointment, canUpdateAppointment } from "@hacado/utils";
import { Metadata } from "next";
import { forbidden, notFound } from "next/navigation";

type Props = PageProps<"/dashboard/appointments/[id]/edit">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("appointments.edit.title"),
  };
}

export default async function NewAssetsPage(props: Props) {
  const t = await getI18nAsync("admin");
  const logger = getLoggerFactory("AdminPages")("edit-appointment");
  const { id } = await props.params;
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      id,
    },
    "Loading edit appointment page",
  );

  const [fields, addons, options] = await Promise.all([
    servicesContainer.servicesService.getFields({}),
    servicesContainer.servicesService.getAddons({}),
    servicesContainer.servicesService.getOptions({}),
  ]);

  const choices: AppointmentChoice[] = (options.items ?? []).map((option) => ({
    ...option,
    addons:
      option.addons
        ?.map((f) => addons.items?.find((x) => x._id === f.id))
        .filter((f) => !!f) || [],
  }));

  const appointment = await servicesContainer.bookingService.getAppointment(id);

  if (!appointment) {
    logger.warn({ id }, "Appointment not found");
    return notFound();
  }

  const session = await getSession();
  if (!canUpdateAppointment(session.user, appointment.memberId)) {
    forbidden();
  }

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.appointments"),
      link: "/dashboard/appointments",
    },
    {
      title: appointment.option.name,
      link: `/dashboard/appointments/${id}`,
    },
    {
      title: t("appointments.edit.title"),
      link: `/dashboard/appointments/${id}/edit`,
    },
  ];

  logger.debug(
    {
      id,
      optionsCount: choices.length,
      fieldsCount: fields.items?.length || 0,
      addonsCount: addons.items?.length || 0,
    },
    "Edit appointment page loaded",
  );

  const currentMemberId = session.user.memberId;
  const canAssignMember = canReassignAppointment(session.user);

  const from: AppointmentScheduleFormFrom = {
    optionId: appointment.option._id,
    addonsIds: appointment.addons?.map((addon) => addon._id),
    customerId: appointment.customer._id,
    fields: appointment.fields,
    dateTime: appointment.dateTime,
    totalDuration: appointment.totalDuration,
    totalPrice: appointment.totalPrice,
    note: appointment.note,
    status: appointment.status,
    discount: appointment.discount,
    memberId: appointment.memberId,
  };

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <Heading
            title={t("appointments.edit.title")}
            description={t("appointments.edit.description")}
          />
        </div>
        <AppointmentScheduleForm
          options={choices}
          knownFields={fields.items || []}
          from={from}
          isEdit={true}
          id={id}
          customer={appointment.customer}
          canAssignMember={canAssignMember}
          currentMemberId={currentMemberId}
        />
      </div>
    </PageContainer>
  );
}
