"use client";

import { adminApi, AdminApiError } from "@hacado/api-sdk";
import { AvailableApps } from "@hacado/app-store";
import {
  AdminKeys,
  BaseAllKeys,
  useI18n,
  useLocale,
} from "@hacado/i18n/client";
import {
  Appointment,
  GiftCardListModel,
  giftCardPaymentMethod,
  inPersonPaymentMethod,
  InStorePaymentUpdateModel,
  Payment,
  paymentLinkPaymentMethod,
  paymentType,
} from "@hacado/types";
import {
  Button,
  cn,
  DateTimePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Textarea,
  toast,
  toastPromise,
  TooltipButton,
  use12HourFormat,
  useCurrencySymbol,
  useTimeZone,
} from "@hacado/ui";
import { CustomerSelector, GiftCardSelector } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, X } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AssignAppointmentDialog } from "./assign-appointment-dialog";
import { PaymentDetailsDialog } from "./payment-details-dialog";

type PaymentLinkApp = { _id: string; name: string };
type PaymentLinkChannel = "email" | "sms" | "copy";

type AddUpdatePaymentDialogProps = {
  onSuccess?: (payment: Payment) => void;
  children: React.ReactNode;
  amount?: number;
} & (
  | { appointmentId?: string; customerId?: string }
  | { giftCardId: string }
  | {
      paymentId: string;
      payment: InStorePaymentUpdateModel;
    }
);

type DialogFormValues = {
  amount: number;
  paidAt?: Date;
  description: string;
  type: (typeof paymentType)[number];
  customerId: string;
  appointmentId?: string;
  giftCardId?: string;
  method:
    | (typeof inPersonPaymentMethod)[number]
    | (typeof giftCardPaymentMethod)[number]
    | (typeof paymentLinkPaymentMethod)[number];
  paymentLinkAppId?: string;
  channel?: PaymentLinkChannel;
  to?: string;
};

const uniqueNonEmpty = (values: (string | null | undefined)[]) => [
  ...new Set(values.filter((value): value is string => !!value)),
];

async function mapPaymentLinkError(error: unknown): Promise<never> {
  if (error instanceof AdminApiError) {
    let code: string | undefined;
    try {
      const body = (await error.response.clone().json()) as { code?: string };
      code = body.code;
    } catch {
      // ignore parse errors
    }
    if (code) {
      throw new Error(code);
    }
  }

  throw error;
}

export const AddUpdatePaymentDialog = ({
  onSuccess,
  children: trigger,
  amount: propsAmount,
  ...props
}: AddUpdatePaymentDialogProps) => {
  const t = useI18n("admin");
  const tRoot = useI18n();
  const locale = useLocale();
  const currencySymbol = useCurrencySymbol();
  const router = useRouter();
  const timeZone = useTimeZone();
  const uses12HourFormat = use12HourFormat();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignedAppointment, setAssignedAppointment] = useState<
    Appointment | undefined
  >(undefined);
  const [detailsPayment, setDetailsPayment] = useState<Payment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [giftCard, setGiftCard] = useState<GiftCardListModel | undefined>(
    undefined,
  );
  const [paymentLinkApps, setPaymentLinkApps] = useState<PaymentLinkApp[]>([]);
  const [emailDestinations, setEmailDestinations] = useState<string[]>([]);
  const [phoneDestinations, setPhoneDestinations] = useState<string[]>([]);

  const isEdit = "paymentId" in props;
  const isGiftCardCreate = "giftCardId" in props;
  const canUsePaymentLink = !isEdit && !isGiftCardCreate;

  const lockedCustomerId = isGiftCardCreate
    ? undefined
    : isEdit
      ? props.payment.customerId
      : props.customerId;

  const lockedAppointmentId = isGiftCardCreate
    ? undefined
    : isEdit
      ? props.payment.appointmentId
      : props.appointmentId;

  const showCustomerSelector =
    !isEdit && !isGiftCardCreate && !lockedCustomerId;

  const showAppointmentSelector =
    !isEdit && !isGiftCardCreate && !lockedAppointmentId;

  const defaultValues: DialogFormValues = isGiftCardCreate
    ? {
        giftCardId: props.giftCardId,
        customerId: "",
        amount: propsAmount ?? 0,
        description: "",
        paidAt: new Date(),
        method: "gift-card",
        type: "payment",
      }
    : isEdit
      ? {
          ...props.payment,
          paidAt: props.payment.paidAt,
        }
      : {
          customerId: lockedCustomerId ?? "",
          appointmentId: lockedAppointmentId,
          amount: propsAmount ?? 0,
          description: "",
          paidAt: new Date(),
          method: "cash",
          type: "payment",
          channel: "copy",
        };

  const schema = useMemo(() => {
    return z
      .object({
        amount: z.coerce
          .number<number>({ error: "validation.payments.amount.positive" })
          .positive("validation.payments.amount.positive"),
        paidAt: z.coerce.date<Date>().optional(),
        description: z
          .string()
          .max(1024, "validation.payments.description.max"),
        type: z.enum(paymentType, {
          error: "validation.payments.type.required",
        }),
        customerId: z
          .string()
          .min(
            1,
            "validation.payments.customerId.required" satisfies BaseAllKeys,
          ),
        appointmentId: z.string().optional(),
        giftCardId: z.string().optional(),
        method: z.enum(
          [
            ...inPersonPaymentMethod,
            ...giftCardPaymentMethod,
            ...paymentLinkPaymentMethod,
          ],
          { error: "validation.payments.method.required" },
        ),
        paymentLinkAppId: z.string().optional(),
        channel: z.enum(["email", "sms", "copy"]).optional(),
        to: z.string().optional(),
      })
      .superRefine((data, ctx) => {
        if (data.method === "gift-card") {
          if (!giftCard) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "validation.payments.giftCardId.required" satisfies BaseAllKeys,
              path: ["giftCardId"],
            });
            return;
          }

          if (!giftCard.amountLeft || giftCard.amountLeft < data.amount) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "validation.payments.giftCardAmount.max" satisfies BaseAllKeys,
              path: ["amount"],
            });
          }
        }

        if (data.method === "payment-link") {
          if (!data.paymentLinkAppId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "validation.payments.paymentLinkAppId.required" satisfies BaseAllKeys,
              path: ["paymentLinkAppId"],
            });
          }

          if (
            (data.channel === "email" || data.channel === "sms") &&
            !data.to?.trim()
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "validation.payments.to.required" satisfies BaseAllKeys,
              path: ["to"],
            });
          }

          return;
        }

        if (!data.paidAt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "validation.payments.paidAt.required" satisfies BaseAllKeys,
            path: ["paidAt"],
          });
        }
      });
  }, [giftCard]);

  const form = useForm<DialogFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "all",
    reValidateMode: "onChange",
  });

  const originalMethod = isEdit ? props.payment.method : undefined;
  const method = form.watch("method");
  const selectedCustomerId = form.watch("customerId");
  const paidAt = form.watch("paidAt");
  const appointmentId = form.watch("appointmentId");
  const channel = form.watch("channel") ?? "copy";
  const destinations =
    channel === "email"
      ? emailDestinations
      : channel === "sms"
        ? phoneDestinations
        : [];

  const resolvedCustomerId =
    lockedCustomerId || selectedCustomerId || undefined;

  const clearAssignedAppointment = () => {
    form.setValue("appointmentId", undefined);
    setAssignedAppointment(undefined);
  };

  const allowedMethods = useMemo(() => {
    if (!isEdit) {
      return [
        ...inPersonPaymentMethod,
        ...giftCardPaymentMethod,
        ...(canUsePaymentLink && paymentLinkApps.length > 0
          ? paymentLinkPaymentMethod
          : []),
      ];
    }

    if (originalMethod === "gift-card") {
      return giftCardPaymentMethod;
    }

    return inPersonPaymentMethod;
  }, [canUsePaymentLink, isEdit, originalMethod, paymentLinkApps.length]);

  const onDialogOpenChange = (next: boolean) => {
    if (!next && loading) {
      return;
    }

    if (next) {
      form.reset(defaultValues);
      setGiftCard(undefined);
      setEmailDestinations([]);
      setPhoneDestinations([]);
      setAssignedAppointment(undefined);
      setAssignOpen(false);
    }

    setOpen(next);
  };

  useEffect(() => {
    if (!open || !canUsePaymentLink) {
      return;
    }

    let cancelled = false;

    adminApi.payments
      .listPaymentLinkApps()
      .then((result) => {
        if (cancelled) {
          return;
        }

        setPaymentLinkApps(result.items);
        if (result.items.length === 1) {
          form.setValue("paymentLinkAppId", result.items[0]._id);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [open, canUsePaymentLink, form]);

  useEffect(() => {
    if (!open || method !== "payment-link" || !resolvedCustomerId) {
      return;
    }

    let cancelled = false;

    adminApi.customers
      .getCustomer(resolvedCustomerId)
      .then((customer) => {
        if (cancelled) {
          return;
        }

        setEmailDestinations(
          uniqueNonEmpty([customer.email, ...(customer.knownEmails ?? [])]),
        );
        setPhoneDestinations(
          uniqueNonEmpty([customer.phone, ...(customer.knownPhones ?? [])]),
        );
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [open, method, resolvedCustomerId]);

  useEffect(() => {
    if (method !== "payment-link") {
      return;
    }

    if (channel === "email" && emailDestinations.length === 0) {
      form.setValue("channel", "copy");
      form.setValue("to", undefined);
      return;
    }

    if (channel === "sms" && phoneDestinations.length === 0) {
      form.setValue("channel", "copy");
      form.setValue("to", undefined);
      return;
    }

    if (channel === "copy") {
      form.setValue("to", undefined);
      return;
    }

    if (destinations.length === 1) {
      form.setValue("to", destinations[0], { shouldValidate: true });
    } else if (
      destinations.length > 1 &&
      !destinations.includes(form.getValues("to") ?? "")
    ) {
      form.setValue("to", destinations[0], { shouldValidate: true });
    }
  }, [
    method,
    channel,
    destinations,
    emailDestinations.length,
    phoneDestinations.length,
    form,
  ]);

  useEffect(() => {
    if (method === "gift-card") {
      form.trigger("amount");
      form.trigger("giftCardId");
    }
  }, [method, form, giftCard]);

  const onSubmit = async (data: DialogFormValues) => {
    try {
      setLoading(true);

      if (!isEdit && data.method === "payment-link") {
        const result = await toastPromise(
          adminApi.payments
            .createPaymentLink({
              amount: data.amount,
              customerId: data.customerId,
              appointmentId: data.appointmentId,
              description: data.description,
              type: data.type,
              paymentLinkAppId: data.paymentLinkAppId!,
              channel: data.channel,
              to: data.to,
            })
            .catch(mapPaymentLinkError),
          {
            success: t("common.toasts.saved"),
            error: (err) => {
              if (
                err instanceof Error &&
                err.message === "payment_app_required"
              ) {
                return t("payment.toasts.paymentAppRequired");
              }

              return t("common.toasts.error");
            },
          },
        );

        if (data.channel === "copy" && result.url) {
          await navigator.clipboard.writeText(result.url);
          toast.success(t("payment.card.linkCopied"));
        }

        onSuccess?.(result.payment);
        router.refresh();
        setOpen(false);
        setDetailsPayment(result.payment);
        setDetailsOpen(true);
        return;
      }

      const instoreBody: InStorePaymentUpdateModel =
        data.method === "gift-card"
          ? {
              amount: data.amount,
              paidAt: data.paidAt!,
              description: data.description,
              type: data.type,
              customerId: data.customerId,
              appointmentId: data.appointmentId,
              method: "gift-card",
              giftCardId: data.giftCardId!,
            }
          : {
              amount: data.amount,
              paidAt: data.paidAt!,
              description: data.description,
              type: data.type,
              customerId: data.customerId,
              appointmentId: data.appointmentId,
              method: data.method as (typeof inPersonPaymentMethod)[number],
            };

      const result = await toastPromise(
        isEdit
          ? adminApi.payments.updateInstore(props.paymentId, instoreBody)
          : adminApi.payments.addInstore(instoreBody),
        {
          success: t("common.toasts.saved"),
          error: t("common.toasts.error"),
        },
      );

      onSuccess?.(result);
      router.refresh();
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const appLabel = (name: string) => {
    const displayName = AvailableApps[name]?.displayName;
    return displayName ? tRoot(displayName) : name;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onDialogOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEdit
                ? t("payment.addUpdatePayment.updatePayment")
                : t("payment.addUpdatePayment.addPayment")}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? t("payment.addUpdatePayment.updatePaymentDescription")
                : t("payment.addUpdatePayment.addPaymentDescription")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="w-full flex flex-col gap-2 relative">
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("payment.addUpdatePayment.form.method.label")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            field.onBlur();
                            if (value === "payment-link") {
                              form.setValue("channel", "copy");
                              if (paymentLinkApps.length === 1) {
                                form.setValue(
                                  "paymentLinkAppId",
                                  paymentLinkApps[0]._id,
                                );
                              }
                            }
                          }}
                          disabled={loading || isGiftCardCreate}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "payment.addUpdatePayment.form.method.label",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedMethods.map((type) => (
                              <SelectItem value={type} key={type}>
                                {t(
                                  `payment.addUpdatePayment.form.method.${type}`,
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {showCustomerSelector && method !== "gift-card" && (
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("payment.addUpdatePayment.form.customerId.label")}
                        </FormLabel>
                        <FormControl>
                          <CustomerSelector
                            onItemSelect={(value: string) => {
                              field.onChange(value);
                              field.onBlur();
                              clearAssignedAppointment();
                            }}
                            value={field.value}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {showAppointmentSelector && (
                  <FormField
                    control={form.control}
                    name="appointmentId"
                    render={() => {
                      const assignLabel = appointmentId
                        ? t(
                            "payment.addUpdatePayment.form.appointmentId.change" as AdminKeys,
                          )
                        : t(
                            "payment.addUpdatePayment.form.appointmentId.assign" as AdminKeys,
                          );
                      const clearLabel = t(
                        "payment.addUpdatePayment.form.appointmentId.clear" as AdminKeys,
                      );
                      const canAssign = !!resolvedCustomerId && !loading;

                      return (
                        <FormItem>
                          <FormLabel>
                            {t(
                              "payment.addUpdatePayment.form.appointmentId.label",
                            )}
                          </FormLabel>
                          <FormControl>
                            <InputGroup className="items-stretch">
                              <InputGroupInput className="min-w-0 flex-1">
                                <div
                                  className={cn(
                                    "flex h-full min-h-9 w-full items-center border border-input bg-background px-3 py-1.5 text-sm",
                                    InputGroupInputClasses(),
                                    !canAssign && "opacity-50",
                                  )}
                                >
                                  {assignedAppointment ? (
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                      <span className="truncate font-medium leading-tight">
                                        {assignedAppointment.option.name}
                                      </span>
                                      <span className="truncate text-xs leading-tight text-muted-foreground">
                                        {DateTime.fromJSDate(
                                          new Date(
                                            assignedAppointment.dateTime,
                                          ),
                                          { zone: timeZone },
                                        ).toLocaleString(
                                          DateTime.DATETIME_MED,
                                          { locale },
                                        )}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      {t(
                                        "payment.addUpdatePayment.form.appointmentId.none" as AdminKeys,
                                      )}
                                    </span>
                                  )}
                                </div>
                              </InputGroupInput>
                              <InputGroupAddon className="items-stretch gap-0">
                                <TooltipButton
                                  type="button"
                                  variant="outline"
                                  size="none"
                                  tooltip={assignLabel}
                                  disabled={!canAssign}
                                  onClick={() => setAssignOpen(true)}
                                  className={cn(
                                    InputGroupAddonClasses(),
                                    "!h-auto min-h-9 self-stretch px-3 py-0",
                                    appointmentId && "rounded-r-none",
                                  )}
                                >
                                  <Pencil />
                                  <span className="sr-only">{assignLabel}</span>
                                </TooltipButton>
                                {appointmentId ? (
                                  <TooltipButton
                                    type="button"
                                    variant="outline"
                                    size="none"
                                    tooltip={clearLabel}
                                    disabled={loading}
                                    onClick={clearAssignedAppointment}
                                    className={cn(
                                      InputGroupAddonClasses(),
                                      "!h-auto min-h-9 self-stretch border-l-0 rounded-l-none px-3 py-0",
                                    )}
                                  >
                                    <X className="opacity-50" />
                                    <span className="sr-only">
                                      {clearLabel}
                                    </span>
                                  </TooltipButton>
                                ) : null}
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}
                {method === "payment-link" && (
                  <>
                    {paymentLinkApps.length >= 2 && (
                      <FormField
                        control={form.control}
                        name="paymentLinkAppId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t(
                                "payment.addUpdatePayment.form.paymentLinkAppId.label",
                              )}
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  field.onBlur();
                                }}
                                disabled={loading}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      "payment.addUpdatePayment.form.paymentLinkAppId.label",
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {paymentLinkApps.map((app) => {
                                    const Logo = AvailableApps[app.name]?.Logo;
                                    return (
                                      <SelectItem value={app._id} key={app._id}>
                                        <span className="flex items-center gap-2">
                                          {Logo ? (
                                            <Logo className="size-4" />
                                          ) : null}
                                          {appLabel(app.name)}
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="channel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("payment.addUpdatePayment.form.channel.label")}
                          </FormLabel>
                          <FormControl>
                            <Select
                              value={field.value ?? "copy"}
                              onValueChange={(value) => {
                                field.onChange(value);
                                field.onBlur();
                              }}
                              disabled={loading}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value="email"
                                  disabled={emailDestinations.length === 0}
                                >
                                  {t(
                                    "payment.addUpdatePayment.form.channel.email",
                                  )}
                                </SelectItem>
                                <SelectItem
                                  value="sms"
                                  disabled={phoneDestinations.length === 0}
                                >
                                  {t(
                                    "payment.addUpdatePayment.form.channel.sms",
                                  )}
                                </SelectItem>
                                <SelectItem value="copy">
                                  {t(
                                    "payment.addUpdatePayment.form.channel.copy",
                                  )}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {(channel === "email" || channel === "sms") && (
                      <FormField
                        control={form.control}
                        name="to"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("payment.addUpdatePayment.form.to.label")}
                            </FormLabel>
                            <FormControl>
                              {destinations.length > 1 ? (
                                <Select
                                  value={field.value}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    field.onBlur();
                                  }}
                                  disabled={loading}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {destinations.map((destination) => (
                                      <SelectItem
                                        value={destination}
                                        key={destination}
                                      >
                                        {destination}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={destinations[0] ?? ""}
                                  disabled
                                  readOnly
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
                {method === "gift-card" && (
                  <>
                    <FormField
                      control={form.control}
                      name="giftCardId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t(
                              "payment.addUpdatePayment.form.giftCardId.label",
                            )}
                          </FormLabel>
                          <FormControl>
                            <GiftCardSelector
                              onItemSelect={(value) => {
                                field.onChange(value);
                                field.onBlur();
                              }}
                              value={field.value}
                              onValueChange={(value) => {
                                setGiftCard(value);
                                form.trigger("amount");
                              }}
                              disabled={loading}
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
                          <FormLabel>
                            {t(
                              "payment.addUpdatePayment.form.customerId.label",
                            )}
                          </FormLabel>
                          <FormControl>
                            <CustomerSelector
                              onItemSelect={(value: string) => {
                                field.onChange(value);
                                field.onBlur();
                              }}
                              value={field.value}
                              disabled={loading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("payment.addUpdatePayment.form.amount")}
                      </FormLabel>
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
                              {...field}
                              disabled={loading}
                              type="number"
                              className={InputGroupInputClasses({
                                variant: "prefix",
                              })}
                            />
                          </InputGroupInput>
                        </InputGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("payment.addUpdatePayment.form.type.label")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            field.onBlur();
                          }}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "payment.addUpdatePayment.form.type.label",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentType.map((type) => (
                              <SelectItem value={type} key={type}>
                                {t(`payment.types.${type}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {method !== "payment-link" && (
                  <FormField
                    control={form.control}
                    name="paidAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("payment.addUpdatePayment.form.paidAt")}
                        </FormLabel>
                        <FormControl>
                          <DateTimePicker
                            use12HourFormat={uses12HourFormat}
                            disabled={loading}
                            timeZone={timeZone}
                            {...field}
                            className="flex w-full"
                            minutesDivisibleBy={5}
                            commitOnChange
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("payment.addUpdatePayment.form.description")}
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} disabled={loading} autoResize />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => onDialogOpenChange(false)}
            >
              {t("common.buttons.close")}
            </Button>
            <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
              {loading ? <Spinner /> : null}
              {isEdit ? t("common.buttons.update") : t("common.buttons.addNew")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {detailsPayment ? (
        <PaymentDetailsDialog
          payment={detailsPayment}
          open={detailsOpen}
          onOpenChange={(next) => {
            setDetailsOpen(next);
            if (!next) {
              setDetailsPayment(null);
            }
          }}
        />
      ) : null}
      {showAppointmentSelector && (
        <AssignAppointmentDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          referenceDate={paidAt}
          currentAppointmentId={appointmentId}
          customerId={resolvedCustomerId}
          lockCustomer
          onConfirm={(nextAppointmentId, appointment) => {
            form.setValue("appointmentId", nextAppointmentId, {
              shouldValidate: true,
              shouldDirty: true,
            });
            setAssignedAppointment(appointment);
          }}
        />
      )}
    </>
  );
};
