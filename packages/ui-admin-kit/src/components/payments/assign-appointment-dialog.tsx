"use client";

import { adminApi, appointmentsSearchParams } from "@hacado/api-sdk";
import { AdminKeys, useI18n, useLocale } from "@hacado/i18n/client";
import {
  Appointment,
  AppointmentStatus,
  appointmentStatuses,
  AppointmentWithReferenceDateDistance,
  DateRange,
  Sort,
} from "@hacado/types";
import {
  Button,
  CalendarDateRangePicker,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useCurrencyFormat,
  useTimeZone,
} from "@hacado/ui";
import {
  CustomerName,
  CustomerSelector,
  DataTableFilterBox,
} from "@hacado/ui-admin";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { DateTime } from "luxon";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 10;
const DEFAULT_SORT: Sort = [{ id: "createdAt", desc: true }];
const REFERENCE_DATE_SORT: Sort = [
  { id: "referenceDateDistanceMs", desc: false },
];
const DEFAULT_STATUS = appointmentsSearchParams.status.defaultValue;
const DATE_COLUMN_CLASS = "w-44 whitespace-nowrap";
const RELATIVE_COLUMN_CLASS = "w-40 whitespace-nowrap";

function getDefaultRange(referenceDate: Date, timeZone: string): DateRange {
  const center = DateTime.fromJSDate(new Date(referenceDate), {
    zone: timeZone,
  });
  return {
    start: center.minus({ days: 7 }).startOf("day").toJSDate(),
    end: center.plus({ days: 7 }).endOf("day").toJSDate(),
  };
}

function formatPaymentOffset(
  appointmentEndAt: Date | string,
  referenceDate: Date,
  timeZone: string,
  t: ReturnType<typeof useI18n<"admin">>,
) {
  const end = DateTime.fromJSDate(new Date(appointmentEndAt), {
    zone: timeZone,
  });
  const payment = DateTime.fromJSDate(new Date(referenceDate), {
    zone: timeZone,
  });
  const diffMs = end.toMillis() - payment.toMillis();

  if (diffMs === 0) {
    return t("syncedPayments.assignDialog.paymentOffset.same");
  }

  const direction = diffMs < 0 ? "before" : "after";
  const totalHours = Math.floor(Math.abs(diffMs) / (3600 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const keyBase =
    `syncedPayments.assignDialog.paymentOffset.${direction}` as const;

  if (days > 0 && hours > 0) {
    return t(`${keyBase}.daysHours` as AdminKeys, { days, hours });
  }
  if (days > 0) {
    return t(`${keyBase}.daysOnly` as AdminKeys, { days });
  }
  if (hours > 0) {
    return t(`${keyBase}.hoursOnly` as AdminKeys, { hours });
  }

  return t("syncedPayments.assignDialog.paymentOffset.same");
}

type AssignAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Payment transaction time used to seed the default appointment date range. */
  referenceDate?: Date;
  /** The appointment the payment is currently assigned to, if any. */
  currentAppointmentId?: string;
  onConfirm: (appointmentId: string) => Promise<void> | void;
};

export const AssignAppointmentDialog = ({
  open,
  onOpenChange,
  referenceDate,
  currentAppointmentId,
  onConfirm,
}: AssignAppointmentDialogProps) => {
  const t = useI18n("admin");
  const locale = useLocale();
  const timeZone = useTimeZone();
  const currencyFormat = useCurrencyFormat();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [range, setRange] = useState<DateRange | undefined>();
  const [statusFilter, setStatusFilterState] =
    useState<AppointmentStatus[]>(DEFAULT_STATUS);
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [sort, setSort] = useState<Sort>(DEFAULT_SORT);
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<
    Appointment[] | AppointmentWithReferenceDateDistance[]
  >([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const requestId = useRef(0);

  const setStatusFilter = useCallback(
    (
      value:
        | AppointmentStatus[]
        | ((old: AppointmentStatus[]) => AppointmentStatus[] | null)
        | null,
    ) => {
      setStatusFilterState((current) => {
        if (value === null) {
          return DEFAULT_STATUS;
        }
        if (typeof value === "function") {
          return value(current) ?? DEFAULT_STATUS;
        }
        return value.length > 0 ? value : DEFAULT_STATUS;
      });
      return Promise.resolve(new URLSearchParams());
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    try {
      const request = {
        search: debouncedSearch || undefined,
        page: page + 1,
        limit: PAGE_SIZE,
        status: statusFilter,
        start: range?.start,
        end: range?.end,
        customer: customerId ? [customerId] : undefined,
        sort,
      };

      const result = referenceDate
        ? await adminApi.appointments.getAppointments({
            ...request,
            referenceDate,
          })
        : await adminApi.appointments.getAppointments(request);

      if (current === requestId.current) {
        setItems(result.items);
        setTotal(result.total);
      }
    } catch {
      if (current === requestId.current) {
        setItems([]);
        setTotal(0);
      }
    } finally {
      if (current === requestId.current) {
        setLoading(false);
      }
    }
  }, [
    debouncedSearch,
    range,
    statusFilter,
    customerId,
    sort,
    page,
    referenceDate,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }
    load();
  }, [open, load]);

  // Reset to the first page whenever the filters or sort change.
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, range, statusFilter, customerId, sort]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setRange(undefined);
      setStatusFilterState(DEFAULT_STATUS);
      setCustomerId(undefined);
      setSort(DEFAULT_SORT);
      setPage(0);
      setSelected(undefined);
      return;
    }

    setRange(
      referenceDate ? getDefaultRange(referenceDate, timeZone) : undefined,
    );
    setStatusFilterState(DEFAULT_STATUS);
    setSort(referenceDate ? REFERENCE_DATE_SORT : DEFAULT_SORT);
    setPage(0);
    setSelected(undefined);
  }, [open, referenceDate, timeZone]);

  const toggleSort = (id: string) => {
    setSort((current) => {
      const active = current[0]?.id === id;
      return [{ id, desc: active ? !current[0]?.desc : false }];
    });
  };

  const formatTime = (value: Date | string) =>
    DateTime.fromJSDate(new Date(value), { zone: timeZone }).toLocaleString(
      DateTime.DATETIME_MED,
      { locale },
    );

  const renderSortHead = (field: string, labelKey: string, align?: "right") => {
    const active = sort[0]?.id === field;
    const Icon = active
      ? sort[0]?.desc
        ? ArrowDown
        : ArrowUp
      : ChevronsUpDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          align === "right" && "flex-row-reverse",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {t(labelKey as AdminKeys)}
        <Icon className="size-3.5" />
      </button>
    );
  };

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE + items.length);
  const hasNextPage = (page + 1) * PAGE_SIZE < total;
  const columnCount = referenceDate ? 7 : 6;

  const confirm = async () => {
    if (!selected) {
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(selected);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[80%]">
        <DialogHeader>
          <DialogTitle>{t("syncedPayments.assignDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("syncedPayments.assignDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("syncedPayments.assignDialog.searchPlaceholder")}
            className="flex-1"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="grid sm:max-w-sm min-w-0">
              <CustomerSelector
                value={customerId}
                allowClear
                onItemSelect={(value) => setCustomerId(value)}
                className="w-full"
              />
            </div>
            <div className="grid sm:max-w-sm min-w-0">
              <CalendarDateRangePicker
                range={range}
                onChange={setRange}
                timeZone={timeZone}
                className="sm:w-auto sm:min-w-56"
              />
            </div>
            <DataTableFilterBox
              filterKey="status"
              title={t("appointments.table.filters.status")}
              options={appointmentStatuses.map((value) => ({
                value,
                label: t(`appointments.status.${value}`),
              }))}
              setFilterValue={setStatusFilter}
              filterValue={statusFilter}
            />
          </div>
        </div>

        <ScrollArea className="h-80 rounded-md border border-border">
          <RadioGroup
            value={selected}
            onValueChange={setSelected}
            className="gap-0"
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>
                    {renderSortHead(
                      "option.name",
                      "syncedPayments.assignDialog.columns.option",
                    )}
                  </TableHead>
                  <TableHead>
                    {renderSortHead(
                      "customer.name",
                      "syncedPayments.assignDialog.columns.customer",
                    )}
                  </TableHead>
                  <TableHead className={DATE_COLUMN_CLASS}>
                    {renderSortHead(
                      "dateTime",
                      "syncedPayments.assignDialog.columns.dateTime",
                    )}
                  </TableHead>
                  {referenceDate && (
                    <TableHead className={RELATIVE_COLUMN_CLASS}>
                      {renderSortHead(
                        "referenceDateDistanceMs",
                        "syncedPayments.assignDialog.columns.paymentOffset",
                      )}
                    </TableHead>
                  )}
                  <TableHead className={DATE_COLUMN_CLASS}>
                    {renderSortHead(
                      "createdAt",
                      "syncedPayments.assignDialog.columns.requestedAt",
                    )}
                  </TableHead>
                  <TableHead className="text-right">
                    {renderSortHead(
                      "totalPrice",
                      "syncedPayments.assignDialog.columns.price",
                    )}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columnCount}>
                      <div className="flex justify-center py-8">
                        <Spinner />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      className="py-8 text-center text-base text-muted-foreground"
                    >
                      {t("syncedPayments.assignDialog.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((appointment) => {
                    const isCurrent = appointment._id === currentAppointmentId;
                    return (
                      <TableRow
                        key={appointment._id}
                        data-state={
                          selected === appointment._id ? "selected" : undefined
                        }
                        className={isCurrent ? "opacity-50" : "cursor-pointer"}
                        onClick={() =>
                          !isCurrent && setSelected(appointment._id)
                        }
                      >
                        <TableCell>
                          <RadioGroupItem
                            value={appointment._id}
                            disabled={isCurrent}
                            aria-label={appointment.option.name}
                          />
                        </TableCell>
                        <TableCell>{appointment.option.name}</TableCell>
                        <TableCell>
                          {appointment.customer?.name ? (
                            <CustomerName customer={appointment.customer} />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className={DATE_COLUMN_CLASS}>
                          {formatTime(appointment.dateTime)}
                        </TableCell>
                        {referenceDate && (
                          <TableCell className={RELATIVE_COLUMN_CLASS}>
                            {formatPaymentOffset(
                              appointment.endAt,
                              referenceDate,
                              timeZone,
                              t,
                            )}
                          </TableCell>
                        )}
                        <TableCell className={DATE_COLUMN_CLASS}>
                          {formatTime(appointment.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {appointment.totalPrice
                            ? currencyFormat(appointment.totalPrice)
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </ScrollArea>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {t("syncedPayments.pagination.summary", { from, to, total })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || loading}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              {t("syncedPayments.pagination.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNextPage || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              {t("syncedPayments.pagination.next")}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("syncedPayments.assignDialog.cancel")}
          </Button>
          <Button onClick={confirm} disabled={!selected || submitting}>
            {submitting && <Spinner />}{" "}
            {t("syncedPayments.assignDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
