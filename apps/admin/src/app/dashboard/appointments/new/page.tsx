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
import { canReassignAppointment } from "@hacado/utils";
import { Metadata } from "next";
import { searchParamsCache } from "./search-params";

type Props = PageProps<"/dashboard/appointments/new">;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18nAsync("admin");
  return {
    title: t("appointments.new.title"),
  };
}

export default async function NewAppointmentPage(props: Props) {
  const t = await getI18nAsync("admin");
  const logger = getLoggerFactory("AdminPages")("new-appointment");
  const awaitedSearchParams = await props.searchParams;
  const searchParams = searchParamsCache.parse(awaitedSearchParams);
  const servicesContainer = await getServicesContainer();
  logger.debug(
    {
      from: searchParams.from,
      customer: searchParams.customer,
      fromValue: searchParams.fromValue ? "yes" : "no",
      data: searchParams.data ? "yes" : "no",
    },
    "Loading new appointment page",
  );

  const breadcrumbItems = [
    { title: t("navigation.dashboard"), link: "/dashboard" },
    {
      title: t("navigation.appointments"),
      link: "/dashboard/appointments",
    },
    {
      title: t("appointments.new.title"),
      link: "/dashboard/appointments/new",
    },
  ];

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

  const appointment = searchParams?.from
    ? await servicesContainer.bookingService.getAppointment(searchParams.from)
    : undefined;

  const session = await getSession();
  const currentMemberId = session.user.memberId;
  const canAssignMember = canReassignAppointment(session.user);

  let from: AppointmentScheduleFormFrom | undefined = appointment
    ? {
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
        data: searchParams.data as Record<string, any>,
        memberId: appointment.memberId,
      }
    : {
        ...(searchParams.fromValue ?? {}),
        memberId: (searchParams?.fromValue as any)?.memberId ?? currentMemberId,
        data: searchParams.data as Record<string, any>,
      };

  // Ensure package prefill always has the package's service selected.
  if (from?.customerPackageId && !from.optionId) {
    const soldPackage =
      await servicesContainer.packagesService.getCustomerPackage(
        from.customerPackageId,
      );
    if (soldPackage?.items[0]?.optionId) {
      from = { ...from, optionId: soldPackage.items[0].optionId };
    }
  }

  const customer =
    !from?.customerId && searchParams.customer
      ? await servicesContainer.customersService.getCustomer(
          searchParams.customer,
        )
      : undefined;

  logger.debug(
    {
      from: searchParams.from,
      fromValue: searchParams.fromValue ? "yes" : "no",
      customer: searchParams.customer,
      hasFromAppointment: !!from,
      hasCustomer: !!customer,
      optionsCount: choices.length,
      fieldsCount: fields.items?.length || 0,
      addonsCount: addons.items?.length || 0,
    },
    "New appointment page loaded",
  );

  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col gap-4 w-full">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex flex-row items-center gap-4 justify-between">
          <Heading
            title={t("appointments.new.title")}
            description={t("appointments.new.description")}
          />
        </div>
        <AppointmentScheduleForm
          options={choices}
          knownFields={fields.items || []}
          from={from}
          isEdit={false}
          customer={customer}
          currentMemberId={currentMemberId}
          canAssignMember={canAssignMember}
        />
      </div>
    </PageContainer>
  );
}
