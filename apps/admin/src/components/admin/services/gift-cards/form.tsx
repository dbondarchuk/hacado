"use client";

import { adminApi } from "@hacado/api-sdk";
import { AvailableApps } from "@hacado/app-store";
import { BaseAllKeys, useI18n } from "@hacado/i18n/client";
import {
  CustomerListModel,
  getGiftCardSchemaWithUniqueCheck,
  GiftCardListModel,
  InPersonPaymentMethod,
  inPersonPaymentMethod,
  paymentLinkPaymentMethod,
} from "@hacado/types";
import {
  Button,
  cn,
  DateTimePicker,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
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
  toast,
  toastPromise,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  use12HourFormat,
  useCurrencySymbol,
  useDebounceCacheFn,
} from "@hacado/ui";
import { CustomerSelector, SaveButton } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Dices } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const expiryDate = DateTime.now().plus({ days: 365 }).endOf("day").toJSDate();
const minDate = DateTime.now().plus({ days: 1 }).startOf("day").toJSDate();

const generateGiftCardCode = () => {
  return (
    Math.random().toString(36).substring(2, 5).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 5).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 5).toUpperCase()
  );
};

const defaultCode = generateGiftCardCode();

type PaymentLinkApp = { _id: string; name: string };

export const GiftCardForm: React.FC<{
  initialData?: GiftCardListModel;
}> = ({ initialData }) => {
  const t = useI18n("admin");
  const tRoot = useI18n();
  const currencySymbol = useCurrencySymbol();
  const uses12HourFormat = use12HourFormat();
  const [paymentLinkApps, setPaymentLinkApps] = useState<PaymentLinkApp[]>([]);
  const [customer, setCustomer] = useState<CustomerListModel | undefined>(
    undefined,
  );

  const cachedGiftCardCodeCheck = useDebounceCacheFn(
    adminApi.giftCards.checkGiftCardCodeUnique,
    300,
  );

  const formSchema = useMemo(() => {
    const schema = getGiftCardSchemaWithUniqueCheck(
      (code) => cachedGiftCardCodeCheck(code, initialData?._id),
      "validation.giftCard.code.unique" satisfies BaseAllKeys,
      !initialData?._id,
    );

    if (!initialData?._id) {
      return schema
        .extend({
          paymentMethod: z.enum(
            [...inPersonPaymentMethod, ...paymentLinkPaymentMethod],
            {
              error: "validation.giftCard.paymentMethod.required",
            },
          ),
          paymentLinkAppId: z.string().optional(),
          channel: z.enum(["email", "sms", "copy"]).optional(),
          to: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (data.paymentMethod !== "payment-link") {
            return;
          }
          if (!data.paymentLinkAppId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["paymentLinkAppId"],
              message:
                "validation.payments.paymentLinkAppId.required" satisfies BaseAllKeys,
            });
          }
          if (
            (data.channel === "email" || data.channel === "sms") &&
            (!data.to || data.to.trim().length === 0)
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["to"],
              message: "validation.payments.to.required" satisfies BaseAllKeys,
            });
          }
        });
    }

    return schema;
  }, [cachedGiftCardCodeCheck, initialData?._id]);

  type FormValues = z.infer<typeof formSchema> & {
    paymentMethod?: string;
    paymentLinkAppId?: string;
    channel?: "email" | "sms" | "copy";
    to?: string;
  };

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      code: defaultCode,
      amount: 50,
      expiresAt: expiryDate,
      paymentMethod: "cash",
      channel: "copy",
    },
  });

  const paymentMethod = form.watch("paymentMethod");
  const channel = form.watch("channel");

  const isPendingPaymentLink =
    !!initialData?._id &&
    initialData.payment?.method === "payment-link" &&
    initialData.payment?.status === "pending";

  const disableAmountUpdate = useMemo(() => {
    if (!initialData?._id) {
      return false;
    }
    return !isPendingPaymentLink;
  }, [initialData?._id, isPendingPaymentLink]);

  useEffect(() => {
    if (initialData?._id) {
      return;
    }
    void adminApi.payments
      .listPaymentLinkApps()
      .then((result) => setPaymentLinkApps(result.items))
      .catch(() => setPaymentLinkApps([]));
  }, [initialData?._id]);

  useEffect(() => {
    if (paymentLinkApps.length === 1) {
      form.setValue("paymentLinkAppId", paymentLinkApps[0]._id);
    }
  }, [paymentLinkApps, form]);

  const emailDestinations = useMemo(
    () => [
      ...new Set([customer?.email].filter((value): value is string => !!value)),
    ],
    [customer?.email],
  );
  const phoneDestinations = useMemo(
    () => [
      ...new Set([customer?.phone].filter((value): value is string => !!value)),
    ],
    [customer?.phone],
  );
  const destinations =
    channel === "email"
      ? emailDestinations
      : channel === "sms"
        ? phoneDestinations
        : [];

  useEffect(() => {
    if (paymentMethod !== "payment-link") {
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
  }, [paymentMethod, channel, destinations, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          if (!("paymentMethod" in data) || !data.paymentMethod) {
            throw new Error("Payment method is required");
          }

          if (data.paymentMethod === "payment-link") {
            const result = await adminApi.payments.createPaymentLink({
              amount: data.amount,
              customerId: data.customerId,
              description: "descriptions.giftCard",
              type: "payment",
              paymentLinkAppId: data.paymentLinkAppId!,
              channel: data.channel,
              to: data.to,
            });

            if (data.channel === "copy" && result.url) {
              try {
                await navigator.clipboard.writeText(result.url);
                toast.success(t("payment.card.linkCopied"));
              } catch (error) {
                console.error(error);
              }
            }

            await adminApi.giftCards.createGiftCard({
              code: data.code,
              amount: data.amount,
              expiresAt: data.expiresAt,
              customerId: data.customerId,
              paymentId: result.payment._id,
            });

            router.push(
              `/dashboard/services/gift-cards?id=${result.payment._id}`,
            );
            return;
          }

          const payment = await adminApi.payments.addInstore({
            amount: data.amount,
            description: "giftCard",
            type: "payment",
            method: data.paymentMethod as InPersonPaymentMethod,
            paidAt: new Date(),
            customerId: data.customerId,
            disableUpdate: true,
          });

          await adminApi.giftCards.createGiftCard({
            code: data.code,
            amount: data.amount,
            expiresAt: data.expiresAt,
            customerId: data.customerId,
            paymentId: payment._id,
          });

          router.push(`/dashboard/services/gift-cards`);
        } else {
          await adminApi.giftCards.updateGiftCard(initialData._id, {
            code: data.code,
            amount: data.amount,
            expiresAt: data.expiresAt,
            customerId: data.customerId,
            paymentId: initialData.paymentId,
          });

          router.refresh();
        }
      };

      await toastPromise(fn(), {
        success: t(
          initialData?._id
            ? "services.giftCards.form.toasts.changesSaved"
            : "services.giftCards.form.toasts.created",
        ),
        error: t("services.giftCards.form.toasts.requestError"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
        <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.giftCards.form.code.label")}{" "}
                  <InfoTooltip>
                    {t("services.giftCards.form.code.generateTooltip")}
                  </InfoTooltip>
                </FormLabel>

                <FormControl>
                  <InputGroup>
                    <InputGroupAddon>
                      <TooltipResponsive>
                        <TooltipResponsiveTrigger
                          className={cn(
                            InputGroupAddonClasses({ variant: "prefix" }),
                            "px-2",
                          )}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={loading || !!initialData?._id}
                            onClick={() => {
                              field.onChange(generateGiftCardCode());
                              field.onBlur();
                              form.trigger("code");
                            }}
                          >
                            <Dices />
                          </Button>
                        </TooltipResponsiveTrigger>
                        <TooltipResponsiveContent>
                          {t("services.giftCards.form.code.tooltip")}
                        </TooltipResponsiveContent>
                      </TooltipResponsive>
                    </InputGroupAddon>
                    <InputGroupInput>
                      <Input
                        disabled={loading || !!initialData?._id}
                        placeholder={t(
                          "services.giftCards.form.code.placeholder",
                        )}
                        className={cn(
                          InputGroupInputClasses(),
                          InputGroupInputClasses({ variant: "prefix" }),
                          "flex-1",
                        )}
                        {...field}
                      />
                    </InputGroupInput>
                    <InputGroupAddon>
                      <TooltipResponsive>
                        <TooltipResponsiveTrigger
                          className={cn(InputGroupAddonClasses(), "px-2")}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!field.value}
                            onClick={() => {
                              navigator.clipboard.writeText(field.value);
                              toast.success(
                                t("services.giftCards.form.code.copied"),
                              );
                            }}
                          >
                            <Copy />
                          </Button>
                        </TooltipResponsiveTrigger>
                        <TooltipResponsiveContent>
                          {t(
                            "services.giftCards.form.code.copyToClipboardTooltip",
                          )}
                        </TooltipResponsiveContent>
                      </TooltipResponsive>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.giftCards.form.amount.label")}
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
                        disabled={loading || disableAmountUpdate}
                        placeholder={t(
                          "services.giftCards.form.amount.placeholder",
                        )}
                        type="number"
                        className={InputGroupInputClasses({
                          variant: "prefix",
                        })}
                        {...field}
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
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.giftCards.form.expiresAt.label")}{" "}
                  <InfoTooltip>
                    <p>{t("services.giftCards.form.expiresAt.tooltip")}</p>
                    <p>{t("common.optional")}</p>
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <DateTimePicker
                    disabled={loading}
                    clearable
                    use12HourFormat={uses12HourFormat}
                    min={minDate}
                    {...field}
                    onChange={(date) => {
                      field.onChange(date ?? null);
                      field.onBlur();
                    }}
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
                  {t("services.giftCards.form.customerId.label")}
                  <InfoTooltip>
                    {t("services.giftCards.form.customerId.tooltip")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <CustomerSelector
                    onItemSelect={(customerId) => {
                      field.onChange(customerId);
                      field.onBlur();
                    }}
                    onValueChange={setCustomer}
                    value={field.value}
                    disabled={loading || !!initialData?._id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!initialData?._id && (
            <>
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("services.giftCards.form.paymentMethod.label")}
                      <InfoTooltip>
                        {t("services.giftCards.form.paymentMethod.tooltip")}
                      </InfoTooltip>
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
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "payment.addUpdatePayment.form.method.label",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {inPersonPaymentMethod.map((type) => (
                            <SelectItem value={type} key={type}>
                              {t(
                                `payment.addUpdatePayment.form.method.${type}`,
                              )}
                            </SelectItem>
                          ))}
                          {paymentLinkApps.length > 0 && (
                            <SelectItem value="payment-link">
                              {t(
                                "payment.addUpdatePayment.form.method.payment-link",
                              )}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {paymentMethod === "payment-link" && (
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
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentLinkApps.map((app) => {
                                  const Logo = AvailableApps[app.name]?.Logo;
                                  const displayName =
                                    AvailableApps[app.name]?.displayName;
                                  return (
                                    <SelectItem value={app._id} key={app._id}>
                                      <span className="flex items-center gap-2">
                                        {Logo ? (
                                          <Logo className="size-4" />
                                        ) : null}
                                        {displayName
                                          ? tRoot(displayName)
                                          : app.name}
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
                                {t("payment.addUpdatePayment.form.channel.sms")}
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
                                      key={destination}
                                      value={destination}
                                    >
                                      {destination}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input {...field} disabled={loading} />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
        <SaveButton form={form} />
      </form>
    </Form>
  );
};
