import { getServicesContainer, getSession } from "@/app/utils";
import PageContainer from "@/components/admin/layout/page-container";
import { canReassignAppointment } from "@timelish/utils";
import { getI18nAsync } from "@timelish/i18n/server";
import { getLoggerFactory } from "@timelish/logger";
import { AppointmentChoice } from "@timelish/types";
import { Breadcrumbs, Heading } from "@timelish/ui";
import {
  AppointmentScheduleForm,
  AppointmentScheduleFormFrom,
} from "@timelish/ui-admin-kit";
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

  const config =
    await servicesContainer.configurationService.getConfiguration("booking");
  const [fields, addons, options] = await Promise.all([
    servicesContainer.servicesService.getFields({}),
    servicesContainer.servicesService.getAddons({}),
    servicesContainer.servicesService.getOptions({}),
  ]);

  const optionsChoices = (config.options || [])
    .map((o) => options.items?.find(({ _id }) => o.id == _id))
    .filter((o) => !!o);

  const choices: AppointmentChoice[] = optionsChoices.map((option) => ({
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

  const from: AppointmentScheduleFormFrom | undefined = appointment
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
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex flex-row items-center gap-4 justify-between">
          <Heading
            title={t("appointments.new.title")}
            description={t("appointments.new.description")}
          />
          {/* {waitlist && (
            <Dialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button variant="ghost">
                        <CalendarClock className="size-4" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t("appointments.new.waitlistEntry")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DialogContent className="@container">
                <DialogHeader>
                  <DialogTitle>
                    {t("appointments.new.waitlistEntry")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("appointments.new.waitlistEntryDescription")}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <WaitlistCardContent entry={waitlist} />
                </ScrollArea>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">
                      {t("common.buttons.close")}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )} */}
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
