"use client";
import { ColumnDef } from "@tanstack/react-table";
import { useI18n, useLocale } from "@timelish/i18n/client";
import { AppointmentEntity, CustomerListModel } from "@timelish/types";
import { Checkbox, Link } from "@timelish/ui";
import {
  CustomerName,
  tableSortHeader,
  tableSortNoopFunction,
  useAuth,
} from "@timelish/ui-admin";
import { hasPermission } from "@timelish/utils";
import { DateTime } from "luxon";
// import Image from "next/image";
import React from "react";
import { CellAction } from "./cell-action";

const AppointmentCell: React.FC<{ appointment?: AppointmentEntity }> = ({
  appointment,
}) => {
  const locale = useLocale();

  return appointment && appointment.option ? (
    <Link
      href={`/dashboard/appointments/${appointment._id}`}
      variant="underline"
    >
      {appointment.option.name} at{" "}
      {DateTime.fromJSDate(appointment.dateTime).toLocaleString(
        DateTime.DATETIME_MED,
        { locale },
      )}
    </Link>
  ) : (
    ""
  );
};

export const columns: ColumnDef<CustomerListModel>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const t = useI18n("admin");
      const { user } = useAuth();
      if (
        !hasPermission(user, "customer", "delete") &&
        !hasPermission(user, "customer", "merge")
      ) {
        return null;
      }
      return (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label={t("customers.table.actions.selectAll")}
        />
      );
    },
    cell: ({ row }) => {
      const t = useI18n("admin");
      const { user } = useAuth();
      if (
        !hasPermission(user, "customer", "delete") &&
        !hasPermission(user, "customer", "merge")
      ) {
        return null;
      }
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={t("customers.table.actions.selectRow")}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    cell: ({ row }) => (
      <img
        alt={row.original.name}
        src={row.original.avatar ?? "/unknown-person.png"}
        width={50}
        height={50}
      />
    ),
    id: "avatar",
    header: "",
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original._id}`}
        variant="underline"
      >
        <CustomerName customer={row.original} />
      </Link>
    ),
    id: "name",
    header: tableSortHeader("customers.table.columns.name", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original._id}`}
        variant="underline"
      >
        {row.original.email}
      </Link>
    ),
    id: "email",
    header: tableSortHeader("customers.table.columns.email", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original._id}`}
        variant="underline"
      >
        {row.original.phone}
      </Link>
    ),
    id: "phone",
    header: tableSortHeader("customers.table.columns.phone", "string", "admin"),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <AppointmentCell appointment={row.original.lastAppointment} />
    ),
    id: "lastAppointment.dateTime",
    header: tableSortHeader(
      "customers.table.columns.lastAppointment",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <AppointmentCell appointment={row.original.nextAppointment} />
    ),
    id: "nextAppointment.dateTime",
    header: tableSortHeader(
      "customers.table.columns.nextAppointment",
      "date",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    cell: ({ row }) => (
      <Link
        href={`/dashboard/customers/${row.original._id}/appointments`}
        variant="underline"
      >
        {row.original.appointmentsCount}
      </Link>
    ),
    id: "appointmentsCount",
    header: tableSortHeader(
      "customers.table.columns.appointments",
      "number",
      "admin",
    ),
    sortingFn: tableSortNoopFunction,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction customer={row.original} />,
  },
];

export const CustomersTableColumnLength = columns.length;
