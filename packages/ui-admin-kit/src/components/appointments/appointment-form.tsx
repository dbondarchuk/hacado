"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@hacado/api-sdk";
import { fallbackLanguage, useI18n } from "@hacado/i18n/client";
import {
  Appointment,
  AppointmentAddon,
  AppointmentChoice,
  AppointmentEventRequest,
  AppointmentFields,
  asOptinalNumberField,
  CalendarEvent,
  Customer,
  CustomerListModel,
  Discount,
  Field,
  getFields,
  OrganizationMember,
  Prettify,
  WithLabelFieldData,
  zNonEmptyString,
} from "@hacado/types";
import {
  Button,
  Checkbox,
  cn,
  Combobox,
  DateTimePicker,
  DurationInput,
  fieldSchemaMapper,
  fieldsComponentMap,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  MultiSelect,
  Spinner,
  Textarea,
  toastPromise,
  use12HourFormat,
  useCurrencyFormat,
  useCurrencySymbol,
  useTimeZone,
} from "@hacado/ui";
import {
  CustomerSelector,
  MemberSelector,
  PromoCodeSelector,
} from "@hacado/ui-admin";
import {
  durationToTime,
  formatAmount,
  getDiscountAmount,
} from "@hacado/utils";
import { CalendarClock, Clock, DollarSign, X } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm, useFormState } from "react-hook-form";
import * as z from "zod";
import { AppointmentCalendar } from "./appointment-calendar";
import {
  isSubscriptionPastDueError,
  SubscriptionPastDueDialog,
} from "./subscription-past-due-dialog";

export const appointmentFromSchema = z.object({
  optionId: z.string().optional(),
  addonsIds: z.array(z.string()).optional(),
  customerId: z.string().optional(),
  memberId: z.string(),
  fields: z.record(z.string(), z.any()).optional(),
  dateTime: z.date().optional(),
  totalDuration: z.number().optional(),
  totalPrice: z.number().optional(),
  note: z.string().optional(),
  status: z.string().optional(),
  discount: z
    .object({
      code: z.string(),
    })
    .optional(),
  data: z.record(z.string(), z.any()).optional(),
});

export type AppointmentScheduleFormFrom = z.infer<typeof appointmentFromSchema>;

export type AppointmentScheduleFormProps = Prettify<
  {
    options: AppointmentChoice[];
    knownFields: (Field<WithLabelFieldData> & { _id: string })[];
    customer?: Customer | null;
    currentMemberId: string;
    canAssignMember: boolean;
  } & (
    | ({
        from: AppointmentScheduleFormFrom;
      } & (
        | {
            isEdit: true;
            id: string;
          }
        | {
            isEdit?: false;
            id?: never;
          }
      ))
    | {
        from?: null;
        isEdit?: false;
        id?: never;
      }
  )
>;

const getSelectedFields = (
  selectedOption: AppointmentChoice | undefined,
  selectedAddons: AppointmentAddon[] | undefined,
  knownFields: AppointmentScheduleFormProps["knownFields"],
) => {
  if (!selectedOption) return [];

  const optionAndAddonFields = [
    ...(selectedOption?.fields || []),
    ...(selectedAddons?.flatMap((addon) => addon.fields) || []),
  ]
    .filter((f) => !!f)
    .reduce(
      (map, cur) => ({
        ...map,
        [cur.id]: !!map[cur.id] || !!cur.required,
      }),
      {} as Record<string, boolean>,
    );

  const fieldsWithData = knownFields
    .filter((f) => f._id in optionAndAddonFields)
    .map((f) => ({
      ...f,
      required:
        (!!f.required || optionAndAddonFields[f._id]) && f.type !== "file",
    }));

  return getFields(fieldsWithData);
};

export const AppointmentScheduleForm: React.FC<
  AppointmentScheduleFormProps
> = ({
  options,
  knownFields,
  from,
  isEdit,
  id,
  customer: propsCustomer,
  canAssignMember,
  currentMemberId,
}) => {
  const t = useI18n("admin");
  const timeZone = useTimeZone();
  const currencyFormat = useCurrencyFormat();
  const currencySymbol = useCurrencySymbol();
  const now = React.useMemo(
    () => DateTime.now().set({ second: 0 }).toJSDate(),
    [],
  );

  const formSchema = z
    .object({
      dateTime: z.coerce.date<Date>({
        error: t("appointments.form.dateTimeRequired"),
      }),
      totalDuration: z.coerce
        .number<number>({ error: t("appointments.form.durationRequired") })
        .int(t("appointments.form.durationInteger"))
        .min(1, t("appointments.form.durationMin"))
        .max(60 * 24 * 10, t("appointments.form.durationMax")),
      totalPrice: asOptinalNumberField(
        z.coerce
          .number<number>({ error: t("appointments.form.priceNumber") })
          .min(0, t("appointments.form.priceMin")),
      ),
      option: zNonEmptyString(t("appointments.form.optionRequired")),
      addons: z
        .array(
          z.object({
            id: zNonEmptyString(t("appointments.form.addonRequired")),
          }),
        )
        .optional(),
      fields: z.looseObject({
        name: z.string().trim(),
        email: z.string().trim(),
        phone: z.string().trim(),
      }),

      note: z.string().optional(),
      confirmed: z.coerce.boolean<boolean>().optional(),
      customerId: z.string().optional(),
      promoCode: z.string().optional().nullable(),
      doNotNotifyCustomer: z.coerce.boolean<boolean>().optional(),
      memberId: z.string().optional(),
    })
    .superRefine((args, ctx) => {
      const option = options.find((x) => x._id === args.option);
      if (!option) return;

      const addons =
        option.addons.filter((x) => args.addons?.some((a) => a.id === x._id)) ||
        [];
      const selectedFields = getSelectedFields(option, addons, knownFields);

      const fieldSchema = z.object(
        selectedFields.reduce(
          (prev, field) => {
            prev[field.name] = fieldSchemaMapper(field);
            return prev;
          },
          {} as { [field: string]: z.ZodType },
        ),
      );

      const result = fieldSchema.safeParse(args.fields);
      if (!result.success) {
        result.error.issues.forEach((err) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [`fields.${err.path}`],
            message: err.message,
          });
        });
      }
    });

  type FormValues = z.infer<typeof formSchema>;

  const fromOption = from
    ? options.find((o) => o._id === from.optionId)
    : undefined;
  const fromAddons =
    from && fromOption
      ? from.addonsIds?.map((a) => fromOption.addons?.find((o) => o._id === a))
      : undefined;

  const fromDuration = from
    ? from?.totalDuration
      ? (fromOption?.durationType === "fixed"
          ? fromOption?.duration
          : fromOption?.durationMin || 0) +
        (fromAddons?.reduce((sum, addon) => sum + (addon?.duration || 0), 0) ||
          0)
      : undefined
    : undefined;

  const fromPrice = from
    ? ((fromOption?.durationType === "fixed"
        ? fromOption?.price
        : (fromOption?.pricePerHour || 0) / 60) || 0) +
      (fromAddons?.reduce((sum, addon) => sum + (addon?.price || 0), 0) || 0)
    : undefined;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    values: {
      dateTime: isEdit ? (from.dateTime ?? now) : now,
      totalDuration:
        from?.totalDuration ||
        fromDuration ||
        (options[0]?.durationType === "fixed"
          ? options[0]?.duration
          : options[0]?.durationMin || 0) ||
        0,
      totalPrice: from?.totalPrice || fromPrice || undefined,
      addons: from?.addonsIds?.map((id) => ({ id })) || [],
      fields: (from?.fields as AppointmentFields) || {
        name: propsCustomer?.name ?? from?.fields?.name ?? "",
        email: propsCustomer?.email ?? from?.fields?.email ?? "",
        phone: propsCustomer?.phone ?? from?.fields?.phone ?? "",
      },
      customerId: from?.customerId ?? propsCustomer?._id ?? "",
      option: from?.optionId ?? options[0]?._id ?? "",
      confirmed: true,
      note: isEdit ? from?.note || "" : "",
      promoCode: isEdit ? from?.discount?.code : undefined,
      doNotNotifyCustomer: false,
      memberId: canAssignMember
        ? (from?.memberId ?? undefined)
        : (currentMemberId ?? from?.memberId ?? undefined),
    },
  });

  const [loading, setLoading] = React.useState(false);
  const [confirmOverlap, setConfirmOverlap] = React.useState(false);
  const [calendarEvents, setCalendarEvents] = React.useState<CalendarEvent[]>(
    [],
  );
  const customerId = form.watch("customerId");
  const [customer, setCustomer] = React.useState<
    CustomerListModel | undefined
  >();

  const [member, setMember] = React.useState<OrganizationMember | undefined>();

  const [discount, setDiscount] = React.useState<
    (Discount & { code: string }) | undefined
  >();
  const [isPastDueDialogOpen, setIsPastDueDialogOpen] = React.useState(false);

  const [disabledFields, setDisabledFields] = React.useState<Set<String>>(
    new Set(),
  );

  const router = useRouter();

  const dateTime = form.watch("dateTime");
  const duration = form.watch("totalDuration");
  const fields = form.watch("fields");
  const price = form.watch("totalPrice");
  const selectedOptionId = form.watch("option");
  const selectedAddonIds = form.watch("addons");
  const selectedMemberId = form.watch("memberId");

  const selectedOption = React.useMemo(
    () => options.find((x) => x._id === selectedOptionId),
    [options, selectedOptionId],
  );

  const selectedAddons = React.useMemo(
    () =>
      selectedOption?.addons?.filter((x) =>
        (selectedAddonIds || []).find((y) => y.id === x._id),
      ),
    [selectedOption, selectedAddonIds],
  );

  const isOverlaping = React.useMemo(() => {
    const appointmentStart = DateTime.fromJSDate(dateTime);
    const appointmentEnd = appointmentStart.plus({
      minutes: duration || 0,
    });

    return calendarEvents.some((app) => {
      if (isEdit && "_id" in app && app._id === id) return false;

      const appStart = DateTime.fromJSDate(app.dateTime);
      const appEnd = appStart.plus({ minutes: app.totalDuration });

      return (
        (appStart >= appointmentStart && appStart <= appointmentEnd) ||
        (appointmentStart >= appStart && appointmentStart <= appEnd)
      );
    });
  }, [dateTime, duration, calendarEvents]);

  const { isValid } = useFormState(form);

  const onSubmit = async (data: FormValues) => {
    try {
      const option = options.find((opt) => opt._id === data.option);
      if (!option) return;

      const addons =
        data.addons
          ?.map((add) => (option.addons || []).find((a) => a._id === add.id))
          .filter((add) => !!add) || [];

      setLoading(true);
      const { addons: __, ...eventOption } = option;

      const selectedFields = getSelectedFields(option, addons, knownFields);

      // Clean up fields when switching option
      const fields = Object.entries(data.fields)
        .filter(([key]) => selectedFields.some((field) => field.name === key))
        .reduce(
          (acc, [name, value]) => ({
            ...acc,
            [name]: value,
          }),
          {
            name: data.fields.name,
            email: data.fields.email,
            phone: data.fields.phone,
          },
        );

      const files = Object.entries(fields)
        .filter(([_, value]) => (value as any) instanceof File)
        .reduce(
          (map, [key, value]) => ({
            ...map,
            [key]: value as unknown as File,
          }),
          {} as Record<string, File>,
        );

      let appointmentDiscount: AppointmentEventRequest["discount"] | undefined =
        undefined;
      if (data.promoCode && !discount) return;
      if (data.promoCode && discount && data.totalPrice) {
        appointmentDiscount = {
          code: data.promoCode,
          discountAmount: getDiscountAmount(data.totalPrice, discount),
        };
      }

      const appointmentEvent: AppointmentEventRequest = {
        dateTime: data.dateTime,
        optionId: eventOption._id,
        fields,
        totalDuration: data.totalDuration,
        totalPrice: data.totalPrice,
        addonsIds: addons.map((addon) => addon._id),
        note: data.note,
        discount: appointmentDiscount,
        data: from?.data,
        memberId: !isEdit ? data.memberId : undefined,
      };

      let appointmentId = id;
      if (isEdit) {
        await toastPromise(
          adminApi.appointments.updateAppointment(
            id,
            appointmentEvent,
            files,
            data.confirmed,
            data.doNotNotifyCustomer,
          ),
          {
            success: t("appointments.form.updatedSuccess"),
            error: t("appointments.form.requestError"),
          },
        );
      } else {
        const result = await toastPromise(
          adminApi.appointments.createAppointment(
            appointmentEvent,
            files,
            data.confirmed,
          ),
          {
            success: t("appointments.form.scheduledSuccess"),
            error: t("appointments.form.requestError"),
          },
        );

        appointmentId = result._id;
      }

      router.push(`/dashboard/appointments/${appointmentId}`);
    } catch (error: any) {
      if (isSubscriptionPastDueError(error)) {
        setIsPastDueDialogOpen(true);
        return;
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setConfirmOverlap(false);
  }, [dateTime, duration, setConfirmOverlap]);

  const { name, email, phone } = fields;

  const selectedFields = React.useMemo(
    () => getSelectedFields(selectedOption, selectedAddons, knownFields),
    [selectedAddons, selectedOption, knownFields],
  );

  const appointment: Appointment | undefined = React.useMemo(() => {
    if (!selectedOption || !selectedMemberId) return undefined;

    const dt = DateTime.fromJSDate(dateTime);

    return {
      _id: id || "",
      date: dt.startOf("day").toJSDate(),
      time: {
        hour: dt.hour,
        minute: dt.minute,
      },
      dateTime,
      endAt: DateTime.fromJSDate(dateTime)
        .plus({ minutes: duration })
        .toJSDate(),
      totalDuration: duration,
      totalPrice: price,
      fields: { name, email, phone },
      option: {
        ...selectedOption,
        fields: undefined,
        addons: undefined,
      },
      fieldsLabels: selectedFields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: field.data?.label,
        }),
        {},
      ),
      status: "pending",
      timeZone,
      addons: selectedAddonIds,
      createdAt: now,
      customerId: from?.customerId ?? "unknown",
      customer: (customer as unknown as Customer) ?? {
        _id: "unknown",
        name,
        email,
        phone,
        knownEmails: [],
        knownNames: [],
        knownPhones: [],
      },
      organizationId: "unknown",
      memberId: selectedMemberId,
      member: member ?? {
        _id: selectedMemberId,
        name: "",
        email: "",
        phone: "",
        role: "staff",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: "unknown",
        userId: "unknown",
        image: undefined,
        language: fallbackLanguage,
      },
    } as unknown as Appointment;
  }, [
    dateTime,
    duration,
    price,
    selectedOption,
    selectedAddonIds,
    selectedMemberId,
    name,
    email,
    phone,
    selectedFields,
    timeZone,
    now,
    from,
    customer,
    id,
    member,
  ]);

  React.useEffect(() => {
    const newAddons = (selectedAddons || [])
      .filter((addon) =>
        selectedOption?.addons?.some((x) => x._id === addon._id),
      )
      .map(({ _id }) => ({ id: _id }));

    form.setValue("addons", newAddons);
  }, [selectedOption]);

  React.useEffect(() => {
    const duration =
      (selectedOption?.durationType === "fixed"
        ? selectedOption?.duration
        : selectedOption?.durationMin || 0) +
      (selectedAddons || []).reduce(
        (prev, curr) => prev + (curr.duration || 0),
        0,
      );

    let price: number | undefined =
      ((selectedOption?.durationType === "fixed"
        ? selectedOption?.price
        : selectedOption?.pricePerHour) || 0) +
      (selectedAddons || []).reduce(
        (prev, curr) => prev + (curr.price || 0),
        0,
      );

    let priceDiscount = 0;
    if (discount) {
      priceDiscount = getDiscountAmount(price, discount);
    }

    price -= priceDiscount;

    form.setValue("totalDuration", duration);
    form.setValue(
      "totalPrice",
      Math.max(formatAmount(price || 0), 0) || undefined,
    );

    form.trigger("totalDuration");
  }, [selectedOption, selectedAddons, discount]);

  React.useEffect(() => {
    setDisabledFields((prev) => {
      ["name", "email", "phone"].forEach((field) =>
        customerId ? prev.add(field) : prev.delete(field),
      );
      return prev;
    });
  }, [customerId, setDisabledFields]);

  const onCustomerChange = (c?: CustomerListModel) => {
    setCustomer(c);
    if (!!c) {
      form.setValue("fields.name", c.name);
      form.setValue("fields.email", c.email);
      form.setValue("fields.phone", c.phone);
    }
  };

  const uses12HourFormat = use12HourFormat();

  return (
    <Form {...form}>
      <SubscriptionPastDueDialog
        open={isPastDueDialogOpen}
        onOpenChange={setIsPastDueDialogOpen}
      />
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-2">
            <div className="w-full space-y-4 relative px-1 content-start">
              <FormField
                control={form.control}
                name="option"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("appointments.form.appointmentType")}
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        disabled={loading}
                        className="flex w-full font-normal text-lg"
                        searchLabel={t("appointments.form.selectOption")}
                        value={field.value}
                        onItemSelect={field.onChange}
                        values={options.map((x) => ({
                          value: x._id,
                          shortLabel: x.name,
                          label: (
                            <div className="flex flex-col gap-1">
                              <div>{x.name}</div>
                              <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
                                <div className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{" "}
                                  {x.durationType === "fixed"
                                    ? t(
                                        "common.timeDuration",
                                        durationToTime(x.duration),
                                      )
                                    : t("appointments.form.custom")}
                                </div>
                                {x.durationType === "fixed" && !!x.price && (
                                  <div className="inline-flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />{" "}
                                    {currencyFormat(x.price)}
                                  </div>
                                )}
                                {x.durationType === "flexible" &&
                                  !!x.pricePerHour && (
                                    <div className="inline-flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />{" "}
                                      {t("common.pricePerHour", {
                                        price: currencyFormat(x.pricePerHour),
                                      })}
                                    </div>
                                  )}
                              </div>
                            </div>
                          ),
                        }))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appointments.form.dateTime")}</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        use12HourFormat={uses12HourFormat}
                        disabled={loading}
                        commitOnChange
                        min={new Date()}
                        timeZone={timeZone}
                        {...field}
                        className="flex w-full"
                        minutesDivisibleBy={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appointments.form.addons")}</FormLabel>
                    <FormControl>
                      <MultiSelect
                        placeholder={t("appointments.form.selectAddons")}
                        selected={field.value?.map((x) => x.id) || []}
                        onChange={(value) =>
                          field.onChange(value.map((id) => ({ id })))
                        }
                        options={
                          selectedOption?.addons.map((addon) => ({
                            value: addon._id,
                            label: addon.name,
                          })) || []
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appointments.form.customer")}</FormLabel>
                    <FormControl>
                      <CustomerSelector
                        onItemSelect={field.onChange}
                        value={field.value}
                        disabled={
                          loading || !!from?.customerId || !!propsCustomer
                        }
                        onValueChange={onCustomerChange}
                        allowClear={!from?.customerId && !propsCustomer}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEdit && (
                <FormField
                  control={form.control}
                  name="memberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("appointments.form.assignTo")}</FormLabel>
                      <FormControl>
                        <MemberSelector
                          value={field.value}
                          onItemSelect={field.onChange}
                          canAssign={canAssignMember}
                          onValueChange={setMember}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {selectedFields.map((field) => (
                <React.Fragment key={field.name}>
                  {fieldsComponentMap("fields")[field.type](
                    field,
                    // @ts-expect-error ignore typecheck for form.control
                    form.control,
                    loading || disabledFields.has(field.name),
                  )}
                </React.Fragment>
              ))}
              <FormField
                control={form.control}
                name="promoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appointments.form.discount")}</FormLabel>
                    <FormControl>
                      <PromoCodeSelector
                        onItemSelect={(val) => {
                          field.onChange(val ?? null);
                          field.onBlur();
                        }}
                        value={field.value as string | undefined}
                        disabled={loading}
                        onValueChange={(val) => {
                          setDiscount(val);
                        }}
                        allowClear
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appointments.form.duration")}</FormLabel>
                    <FormControl>
                      <DurationInput disabled={loading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="totalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appointments.form.price")}</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon
                          className={InputGroupAddonClasses({
                            variant: "prefix",
                          })}
                        >
                          {currencySymbol}
                        </InputGroupAddon>
                        <InputGroupInput>
                          <Input
                            disabled={loading}
                            placeholder="30.00"
                            type="number"
                            className={cn(
                              InputGroupInputClasses({
                                variant: "prefix",
                              }),
                              "rounded-r-none",
                            )}
                            {...field}
                          />
                        </InputGroupInput>

                        <Button
                          variant="outline"
                          className="rounded-l-none border-l-0"
                          onClick={() => {
                            field.onChange("");
                            field.onBlur();
                          }}
                        >
                          <X className="w-4 h-4 opacity-50" />
                        </Button>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("appointments.form.note")}</FormLabel>
                    <FormControl>
                      <Textarea autoResize {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(!isEdit || from?.status === "pending") && (
                <FormField
                  control={form.control}
                  name="confirmed"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-row items-center gap-2">
                        <Checkbox
                          id="confirmed"
                          disabled={loading}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FormLabel
                          htmlFor="confirmed"
                          className="cursor-pointer"
                        >
                          {t("appointments.form.confirmAppointment")}
                        </FormLabel>
                      </div>
                      <FormDescription>
                        {t("appointments.form.confirmAppointmentDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {isEdit && (
                <FormField
                  control={form.control}
                  name="doNotNotifyCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-row items-center gap-2">
                        <Checkbox
                          id="doNotNotifyCustomer"
                          disabled={loading}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FormLabel
                          htmlFor="doNotNotifyCustomer"
                          className="cursor-pointer"
                        >
                          {t("appointments.form.doNotNotifyCustomer")}
                        </FormLabel>
                      </div>
                      <FormDescription>
                        {t("appointments.form.doNotNotifyCustomerDescription")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {isOverlaping && (
                <FormItem>
                  <div className="flex flex-row items-center gap-2">
                    <Checkbox
                      id="confirm-overlap"
                      disabled={loading}
                      checked={confirmOverlap}
                      onCheckedChange={(e) => setConfirmOverlap(!!e)}
                    />
                    <FormLabel
                      htmlFor="confirm-overlap"
                      className="cursor-pointer"
                    >
                      {t("appointments.form.confirmOverlap")}
                    </FormLabel>
                  </div>
                  <FormDescription>
                    {t("appointments.form.confirmOverlapDescription")}
                  </FormDescription>
                </FormItem>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {appointment && (
                <AppointmentCalendar
                  appointment={appointment}
                  onEventsLoad={setCalendarEvents}
                />
              )}
            </div>
          </div>
        </div>
        <Button
          disabled={loading || !isValid || (isOverlaping && !confirmOverlap)}
          className="ml-auto self-end fixed bottom-4 right-4 inline-flex gap-1 items-center z-50"
          type="submit"
        >
          {loading ? (
            <Spinner className="w-4 h-4" />
          ) : (
            <CalendarClock className="w-4 h-4" />
          )}{" "}
          {t(
            isEdit
              ? "appointments.form.updateAppointment"
              : "appointments.form.scheduleAppointment",
          )}
        </Button>
      </form>
    </Form>
  );
};
