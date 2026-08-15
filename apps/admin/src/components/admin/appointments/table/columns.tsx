"use client";
import { useI18n, useLocale } from "@hacado/i18n/client";
import { Appointment } from "@hacado/types";
import {
  Button,
  Link,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useCurrencyFormat,
  useTimeZone,
} from "@hacado/ui";
import {
  CustomerName,
  MemberName,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin";
import { AppointmentDialog } from "@hacado/ui-admin-kit";
import { durationToTime } from "@hacado/utils";
import { ColumnDef } from "@tanstack/react-table";
import {
  CalendarCheck,
  CalendarClock,
  CalendarX,
  LucideProps,
} from "lucide-react";
import { DateTime } from "luxon";
import React from "react";

const StatusCell: React.FC<{ appointment: Appointment } & LucideProps> = ({
  appointment,
  ...rest
}) => {
  const t = useI18n("admin");
  let child: React.ReactNode;
  switch (appointment.status) {
    case "confirmed":
      child = <CalendarCheck {...rest} />;
      break;

    case "declined":
      child = <CalendarX {...rest} />;
      break;

    case "pending":
    default:
      child = <CalendarClock {...rest} />;
      break;
  }

  return (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <div
          className="flex justify-center w-full"
          aria-label={t("appointments.table.columns.statusAriaLabel", {
            status: t(`appointments.status.${appointment.status}`),
          })}
        >
          {child}
        </div>
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent>
        {t(`appointments.status.${appointment.status}`)}
      </TooltipResponsiveContent>
    </TooltipResponsive>
  );
};

const OptionCell: React.FC<{
  appointment: Appointment;
}> = ({ appointment }) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  return (
    <>
      {isDialogOpen && (
        <AppointmentDialog
          defaultOpen={isDialogOpen}
          onOpenChange={(open) => !open && setIsDialogOpen(false)}
          appointment={appointment}
        />
      )}
      <Button
        variant="link-dashed"
        // href={`/dashboard/appointments/${appointment._id}`}
        onClick={() => setIsDialogOpen(true)}
      >
        {appointment.option.name}
      </Button>
      {/* <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="link"
              className="font-normal underline decoration-dashed"
              // href={`/dashboard/appointments/${appointment._id}`}
              onClick={() => setIsDialogOpen(true)}
            >
              {appointment.option.name}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex flex-col gap-2 w-full py-2 px-4">
            <div className="grid grid-cols-2 gap-1 pb-2 border-b">
              <div>{t("appointments.table.columns.optionName")}:</div>
              <div>{appointment.option.name}</div>
              {(appointment.option.price ?? 0) > 0 && (
                <>
                  <div>{t("appointments.table.columns.optionPrice")}:</div>
                  <div>${appointment.option.price}</div>
                </>
              )}
              {appointment.option.duration &&
                appointment.option.duration > 0 && (
                  <>
                    <div>{t("appointments.table.columns.optionDuration")}:</div>
                    <div>
                      {durationToTime(appointment.option.duration).hours} hr{" "}
                      {durationToTime(appointment.option.duration).minutes} min
                    </div>
                  </>
                )}
              {appointment.addons && appointment.addons.length > 0 && (
                <>
                  <div>{t("appointments.table.columns.selectedAddons")}:</div>
                  <ul>
                    {appointment.addons.map((addon, index) => (
                      <li key={index}>
                        {addon.name}
                        {(addon.price || addon.duration) && (
                          <ul className="pl-2">
                            {addon.duration && (
                              <li>{t("appointments.table.columns.duration")}: {addon.duration} min</li>
                            )}
                            {addon.price && <li>{t("appointments.table.columns.price")}: ${addon.price}</li>}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {appointment.note && (
                <>
                  <div>{t("appointments.table.columns.note")}:</div>
                  <div>{appointment.note}</div>
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(appointment.totalDuration ?? 0) > 0 && (
                <>
                  <div className="font-medium">{t("appointments.table.columns.duration")}:</div>
                  <div>
                    {durationToTime(appointment.totalDuration).hours} hr{" "}
                    {durationToTime(appointment.totalDuration).minutes} min
                  </div>
                </>
              )}

              {(appointment.totalPrice ?? 0) > 0 && (
                <>
                  <div className="font-medium">{t("appointments.table.columns.price")}:</div>
                  <div>${appointment.totalPrice}</div>
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider> */}
    </>
  );
};

const CustomerCell: React.FC<{
  appointment: Appointment;
}> = ({ appointment }) => {
  const t = useI18n("admin");
  return (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <Link
          href={`/dashboard/customers/${appointment.customerId}`}
          variant="underline"
        >
          <CustomerName customer={appointment.customer} />
        </Link>
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent className="flex flex-col gap-2 w-full py-2 px-4">
        {appointment.customer.isDeleted ? (
          t("customers.deletedCustomer")
        ) : (
          <div className="grid grid-cols-2 gap-1">
            <div>{t("appointments.table.columns.customerName")}:</div>
            <div>{appointment.customer.name}</div>
            <div>{t("appointments.table.columns.customerEmail")}:</div>
            <div>{appointment.customer.email}</div>
            <div>{t("appointments.table.columns.customerPhone")}:</div>
            <div>{appointment.customer.phone}</div>
          </div>
        )}
      </TooltipResponsiveContent>
    </TooltipResponsive>
  );
};

// type TimezoneCellContext<TData extends RowData, TValue = unknown> = CellContext<
//   TData,
//   TValue
// > & {
// };

export const columns: ColumnDef<Appointment>[] = [
  // {
  //   id: "select",
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={table.getIsAllPageRowsSelected()}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    cell: ({ row }) => (
      <StatusCell appointment={row.original} className="size-4" />
    ),
    id: "status",
    header: tableSortHeader(
      "appointments.table.columns.status",
      "default",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
    enableResizing: false,
    meta: {
      dontGrow: true,
    },
  },
  {
    cell: ({ row }) => <OptionCell appointment={row.original} />,
    id: "option.name",
    header: tableSortHeader(
      "appointments.table.columns.option",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => <CustomerCell appointment={row.original} />,
    id: "customer.name",
    header: tableSortHeader(
      "appointments.table.columns.customer",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => <MemberName member={row.original.member} />,
    id: "member.name",
    header: tableSortHeader(
      "appointments.table.columns.member",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const timeZone = useTimeZone();
      const locale = useLocale();
      return DateTime.fromJSDate(row.original.dateTime)
        .setZone(timeZone)
        .toLocaleString(DateTime.DATETIME_MED, { locale });
    },
    id: "dateTime",
    header: tableSortHeader(
      "appointments.table.columns.dateTime",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const timeZone = useTimeZone();
      const locale = useLocale();
      return DateTime.fromJSDate(row.original.createdAt)
        .setZone(timeZone)
        .toLocaleString(DateTime.DATETIME_MED, { locale });
    },
    id: "createdAt",
    header: tableSortHeader(
      "appointments.table.columns.requestedAt",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const time = durationToTime(row.original.totalDuration);
      const t = useI18n("admin");

      return <span>{t("common.timeDuration", time)}</span>;
    },
    id: "totalDuration",
    header: tableSortHeader(
      "appointments.table.columns.duration",
      "time",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => {
      const t = useI18n("admin");
      return row.original.meetingInformation?.url ? (
        <Link href={row.original.meetingInformation.url} variant="underline">
          {t("appointments.table.columns.meetingLink")}
        </Link>
      ) : null;
    },
    id: "meetingInformation.url",
    header: tableSortHeader(
      "appointments.table.columns.online",
      "string",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) =>
      row.original.discount ? (
        <DiscountCell appointment={row.original} />
      ) : null,
    id: "discount.name",
    header: tableSortHeader(
      "appointments.table.columns.discount",
      "time",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => <TotalPriceCell appointment={row.original} />,
    id: "totalPrice",
    header: tableSortHeader(
      "appointments.table.columns.price",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
];

function DiscountCell({ appointment }: { appointment: Appointment }) {
  const currencyFormat = useCurrencyFormat();

  if (!appointment.discount) {
    return null;
  }

  return (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <Link
          variant="underline"
          href={`/dashboard/services/discounts/${appointment.discount.id}`}
        >
          {appointment.discount.code}{" "}
          <span className="text-sm">
            {currencyFormat(-1 * appointment.discount.discountAmount)}
          </span>
        </Link>
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent>
        {appointment.discount.name}
      </TooltipResponsiveContent>
    </TooltipResponsive>
  );
}

function TotalPriceCell({ appointment }: { appointment: Appointment }) {
  const currencyFormat = useCurrencyFormat();
  return appointment.totalPrice ? currencyFormat(appointment.totalPrice) : null;
}
