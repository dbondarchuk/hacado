"use client";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentEntity } from "@hacado/types/booking";
import { CustomerListModel } from "@hacado/types/customers";
import { useAuth } from "@hacado/ui-admin/context";
import {
  CustomerName,
  TableDateTime,
  tableSortHeader,
  tableSortNoopFunction,
} from "@hacado/ui-admin/data-table";
import { Checkbox } from "@hacado/ui/checkbox";
import { Link } from "@hacado/ui/link";
import { hasPermission } from "@hacado/utils/permissions";
import { ColumnDef } from "@tanstack/react-table";
// import Image from "next/image";
import React from "react";
import { CellAction } from "./cell-action";

const AppointmentCell: React.FC<{ appointment?: AppointmentEntity }> = ({
  appointment,
}) => {
  return appointment && appointment.service ? (
    <Link
      href={`/dashboard/appointments/${appointment._id}`}
      variant="underline"
      size="sm"
    >
      {appointment.service.name} at{" "}
      <TableDateTime value={appointment.dateTime} />
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
        size="sm"
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
        size="sm"
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
        size="sm"
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
        size="sm"
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
