"use client";

import { adminApi, AdminApiError } from "@hacado/api-sdk";
import { AvailableApps } from "@hacado/app-store";
import { useI18n } from "@hacado/i18n/client";
import {
  AppointmentPackage,
  inPersonPaymentMethod,
  paymentLinkPaymentMethod,
  zObjectId,
} from "@hacado/types";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
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
  toast,
  toastPromise,
  useCurrencySymbol,
} from "@hacado/ui";
import { CustomerSelector, PackageSelector } from "@hacado/ui-admin";
import {
  SmsConsentAttest,
  useCustomerPhoneSmsConsent,
} from "@hacado/ui-admin-kit";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const noDestinations: string[] = [];

const uniqueNonEmpty = (values: (string | null | undefined)[]) => [
  ...new Set(values.filter((value): value is string => !!value)),
];

const sellSchema = z
  .object({
    packageId: zObjectId("validation.package.sell.packageId.required"),
    customerId: zObjectId("validation.package.sell.customerId.required"),
    price: z.coerce
      .number<number>("validation.package.sell.price.min")
      .min(0, "validation.package.sell.price.min"),
    paymentMethod: z.enum(
      [...inPersonPaymentMethod, ...paymentLinkPaymentMethod],
      {
        error: "validation.package.sell.paymentMethod.required",
      },
    ),
    paymentLinkAppId: z.string().optional(),
    channel: z.enum(["email", "sms", "copy"]).optional(),
    to: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.price <= 0 || data.paymentMethod !== "payment-link") {
      return;
    }
    if (!data.paymentLinkAppId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentLinkAppId"],
        message: "validation.payments.paymentLinkAppId.required",
      });
    }
    if (
      (data.channel === "email" || data.channel === "sms") &&
      !data.to?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message: "validation.payments.to.required",
      });
    }
  });

type SellFormValues = z.infer<typeof sellSchema>;
type PaymentLinkApp = { _id: string; name: string };

export const SellPackageDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg?: AppointmentPackage;
  onSuccess?: (customerPackageId: string, packageId: string) => void;
}> = ({ open, onOpenChange, pkg, onSuccess }) => {
  const t = useI18n("admin");
  const tRoot = useI18n();
  const currencySymbol = useCurrencySymbol();
  const [loading, setLoading] = React.useState(false);
  const [smsConsent, setSmsConsent] = React.useState(false);
  const [paymentLinkApps, setPaymentLinkApps] = React.useState<
    PaymentLinkApp[]
  >([]);
  const [emailDestinations, setEmailDestinations] = React.useState<string[]>(
    [],
  );
  const [phoneDestinations, setPhoneDestinations] = React.useState<string[]>(
    [],
  );
  const [selectedPackage, setSelectedPackage] = React.useState<
    AppointmentPackage | undefined
  >(pkg);

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellSchema),
    mode: "all",
    defaultValues: {
      packageId: pkg?._id ?? "",
      customerId: "",
      price: pkg?.price ?? 0,
      paymentMethod: "cash",
      channel: "copy",
    },
  });

  const price = form.watch("price");
  const paymentMethod = form.watch("paymentMethod");
  const channel = form.watch("channel");
  const customerId = form.watch("customerId");
  const smsTo = form.watch("to");
  const sendingSms =
    price > 0 && paymentMethod === "payment-link" && channel === "sms";
  const smsConsentStatus = useCustomerPhoneSmsConsent(
    sendingSms ? customerId : undefined,
    sendingSms ? smsTo : undefined,
  );
  const smsBlocked =
    sendingSms &&
    !(
      smsConsentStatus === "consented" ||
      (smsConsentStatus === "missing" && smsConsent)
    );
  const destinations =
    channel === "email"
      ? emailDestinations
      : channel === "sms"
        ? phoneDestinations
        : noDestinations;

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      packageId: pkg?._id ?? "",
      customerId: "",
      price: pkg?.price ?? 0,
      paymentMethod: "cash",
      channel: "copy",
    });
    setSelectedPackage(pkg);
    setSmsConsent(false);
  }, [open, pkg, form]);

  React.useEffect(() => {
    if (!open) return;
    void adminApi.payments
      .listPaymentLinkApps()
      .then((result) => setPaymentLinkApps(result.items))
      .catch(() => setPaymentLinkApps([]));
  }, [open]);

  React.useEffect(() => {
    if (paymentLinkApps.length === 1) {
      form.setValue("paymentLinkAppId", paymentLinkApps[0]._id);
    }
  }, [paymentLinkApps, form]);

  React.useEffect(() => {
    if (!open || !customerId) {
      setEmailDestinations([]);
      setPhoneDestinations([]);
      return;
    }

    let cancelled = false;
    adminApi.customers
      .getCustomer(customerId)
      .then((customer) => {
        if (cancelled) return;

        setEmailDestinations(
          uniqueNonEmpty([customer.email, ...(customer.knownEmails ?? [])]),
        );
        setPhoneDestinations(
          uniqueNonEmpty([customer.phone, ...(customer.knownPhones ?? [])]),
        );
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setEmailDestinations([]);
          setPhoneDestinations([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  React.useEffect(() => {
    if (paymentMethod !== "payment-link") return;

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
      if (form.getValues("to")) form.setValue("to", undefined);
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
    paymentMethod,
    channel,
    destinations,
    emailDestinations.length,
    phoneDestinations.length,
    form,
  ]);

  React.useEffect(() => {
    setSmsConsent(false);
  }, [smsTo]);

  const applySelectedPackage = (next?: AppointmentPackage) => {
    if (next && next._id !== selectedPackage?._id) {
      form.setValue("price", next.price, { shouldValidate: true });
    }
    setSelectedPackage(next);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
      setSelectedPackage(pkg);
      setSmsConsent(false);
    }
    onOpenChange(next);
  };

  const onSubmit = async (values: SellFormValues) => {
    try {
      setLoading(true);
      let definition = selectedPackage;
      if (!definition || definition._id !== values.packageId) {
        definition = await adminApi.packages.getPackage(values.packageId);
      }
      if (!definition) return;

      const sold = await toastPromise(
        (async () => {
          let paymentId: string | undefined;
          let paymentLinkUrl: string | undefined;
          if (values.price > 0 && values.paymentMethod === "payment-link") {
            const result = await adminApi.payments
              .createPaymentLink({
                amount: values.price,
                customerId: values.customerId,
                description: definition.name,
                type: "payment",
                paymentLinkAppId: values.paymentLinkAppId!,
                channel: values.channel,
                to: values.to,
                smsConsent:
                  values.channel === "sms" && smsConsent ? true : undefined,
              })
              .catch(async (error) => {
                if (error instanceof AdminApiError) {
                  let code: string | undefined;
                  try {
                    const body = (await error.response.clone().json()) as {
                      code?: string;
                    };
                    code = body.code;
                  } catch {
                    // ignore parse errors
                  }
                  if (code) throw new Error(code);
                }
                throw error;
              });
            paymentId = result.payment._id;
            paymentLinkUrl = result.url;
          } else if (
            values.price > 0 &&
            values.paymentMethod !== "payment-link"
          ) {
            const payment = await adminApi.payments.addInstore({
              amount: values.price,
              description: definition.name,
              type: "payment",
              method: values.paymentMethod,
              paidAt: new Date(),
              customerId: values.customerId,
              disableUpdate: true,
            });
            paymentId = payment._id;
          }

          try {
            const created = await adminApi.packages.sellPackage(
              values.packageId,
              {
                customerId: values.customerId,
                paymentId,
                price: values.price,
              },
            );
            return { created, paymentLinkUrl };
          } catch (error) {
            if (paymentId && values.paymentMethod === "payment-link") {
              await adminApi.payments
                .cancelPaymentLink(paymentId)
                .catch((cancelError) => {
                  console.error(cancelError);
                });
            }
            throw error;
          }
        })(),
        {
          success: t("services.packages.form.toasts.sold"),
          error: (err) => {
            if (
              err instanceof Error &&
              err.message === "payment_app_required"
            ) {
              return t("payment.toasts.paymentAppRequired");
            }
            if (
              err instanceof Error &&
              err.message === "sms_consent_required"
            ) {
              return t("services.giftCards.form.toasts.smsConsentRequired");
            }
            return t("services.packages.form.toasts.requestError");
          },
        },
      );
      if (values.channel === "copy" && sold.paymentLinkUrl) {
        try {
          await navigator.clipboard.writeText(sold.paymentLinkUrl);
          toast.success(t("payment.card.linkCopied"));
        } catch (error) {
          console.error(error);
        }
      }
      handleOpenChange(false);
      onSuccess?.(sold.created._id, values.packageId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("services.packages.sellTitle")}</DialogTitle>
          <DialogDescription>
            {t("services.packages.sellDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="sell-package-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="packageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("services.packages.sellForm.package")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <PackageSelector
                        disabled={loading || !!pkg}
                        value={field.value}
                        onItemSelect={field.onChange}
                        onValueChange={(next) =>
                          applySelectedPackage(next ?? pkg)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("services.packages.sellForm.price")}
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
                            type="number"
                            step={0.01}
                            min={0}
                            {...field}
                            disabled={loading || !selectedPackage}
                            className={InputGroupInputClasses({
                              variant: "prefix",
                            })}
                            onChange={(e) => {
                              const value = e.target.valueAsNumber;
                              field.onChange(
                                Number.isFinite(value) ? value : 0,
                              );
                            }}
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
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("services.packages.sellForm.customer")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <CustomerSelector
                        value={field.value}
                        onItemSelect={field.onChange}
                        allowClear={false}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {price > 0 ? (
                <>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabelWithRequiredIndicator required>
                          {t("services.packages.sellForm.paymentMethod")}
                        </FormLabelWithRequiredIndicator>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
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
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {inPersonPaymentMethod.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {t(`common.labels.paymentMethod.${method}`)}
                                </SelectItem>
                              ))}
                              {paymentLinkApps.length > 0 ? (
                                <SelectItem value="payment-link">
                                  {t(
                                    "common.labels.paymentMethod.payment-link",
                                  )}
                                </SelectItem>
                              ) : null}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {paymentMethod === "payment-link" ? (
                    <>
                      {paymentLinkApps.length >= 2 ? (
                        <FormField
                          control={form.control}
                          name="paymentLinkAppId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabelWithRequiredIndicator required>
                                {t(
                                  "payment.addUpdatePayment.form.paymentLinkAppId.label",
                                )}
                              </FormLabelWithRequiredIndicator>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  disabled={loading}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {paymentLinkApps.map((app) => {
                                      const Logo =
                                        AvailableApps[app.name]?.Logo;
                                      const displayName =
                                        AvailableApps[app.name]?.displayName;
                                      return (
                                        <SelectItem
                                          value={app._id}
                                          key={app._id}
                                        >
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
                      ) : null}
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
                                onValueChange={field.onChange}
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
                      {channel === "email" || channel === "sms" ? (
                        <FormField
                          control={form.control}
                          name="to"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabelWithRequiredIndicator required>
                                {t("payment.addUpdatePayment.form.to.label")}
                              </FormLabelWithRequiredIndicator>
                              <FormControl>
                                {destinations.length > 1 ? (
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
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
                      ) : null}
                      {sendingSms ? (
                        <div className="sm:col-span-2">
                          <SmsConsentAttest
                            id="package-sell-sms-consent"
                            phone={smsTo}
                            status={smsConsentStatus}
                            checked={smsConsent}
                            disabled={loading}
                            onCheckedChange={setSmsConsent}
                            required
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={loading}>
                  {t("common.buttons.close")}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form="sell-package-form"
                disabled={loading || smsBlocked}
              >
                {loading ? <Spinner className="w-4 h-4" /> : null}
                {t("services.packages.sell")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
