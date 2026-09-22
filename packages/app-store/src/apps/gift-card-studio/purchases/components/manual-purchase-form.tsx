"use client";

import { adminApi } from "@hacado/api-sdk";
import { AvailableApps } from "@hacado/app-store";
import { useI18n } from "@hacado/i18n/client";
import {
  CustomerListModel,
  inPersonPaymentMethod,
  zEmail,
  zMinMaxLengthString,
  zObjectId,
  zOptionalOrMinMaxLengthString,
} from "@hacado/types";
import {
  Button,
  Checkbox,
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
  toastPromise,
  useCurrencySymbol,
  useDebounce,
} from "@hacado/ui";
import { CustomerSelector } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  createPurchasedGiftCard,
  getPreviewImage,
  GetPreviewPayload,
  getSettings,
} from "../../actions";
import { PurchasedGiftCardListModel } from "../../models";
import { GiftCardStudioSettings } from "../../models/settings";
import {
  GiftCardStudioAdminAllKeys,
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { DesignSelector } from "./design-selector";

const manualPurchaseSchema = z
  .object({
    designId: zObjectId(
      "app_gift-card-studio_admin.validation.manualForm.designId.required" satisfies GiftCardStudioAdminAllKeys,
    ),
    amountPurchased: z.coerce
      .number()
      .positive(
        "app_gift-card-studio_admin.validation.manualForm.amountPurchased.positive" satisfies GiftCardStudioAdminAllKeys,
      ),
    customerId: zObjectId(
      "app_gift-card-studio_admin.validation.manualForm.customerId.required" satisfies GiftCardStudioAdminAllKeys,
    ),
    message: zOptionalOrMinMaxLengthString(
      {
        length: 1,
        message:
          "app_gift-card-studio_admin.validation.manualForm.message.required" satisfies GiftCardStudioAdminAllKeys,
      },
      {
        length: 1024,
        message:
          "app_gift-card-studio_admin.validation.manualForm.message.max" satisfies GiftCardStudioAdminAllKeys,
      },
    ),
    paymentType: z.enum(["cash", "in-person-card", "payment-link"], {
      message:
        "app_gift-card-studio_admin.validation.manualForm.paymentType.required" satisfies GiftCardStudioAdminAllKeys,
    }),
    paymentLinkAppId: z.string().optional(),
    channel: z.enum(["email", "sms", "copy"]).optional(),
    to: z.string().optional(),
    sendCustomerEmail: z.coerce.boolean<boolean>().default(true),
    sendRecipientEmail: z.coerce.boolean<boolean>().default(true),
  })
  .and(
    z
      .object({
        sendToAnotherRecipient: z.literal(true, {
          message:
            "app_gift-card-studio_admin.validation.manualForm.sendToAnotherRecipient.required" satisfies GiftCardStudioAdminAllKeys,
        }),
        toName: zMinMaxLengthString(
          {
            length: 1,
            message:
              "app_gift-card-studio_admin.validation.manualForm.toName.min" satisfies GiftCardStudioAdminAllKeys,
          },
          {
            length: 64,
            message:
              "app_gift-card-studio_admin.validation.manualForm.toName.max" satisfies GiftCardStudioAdminAllKeys,
          },
        ),
        toEmail: zEmail,
      })
      .or(
        z.object({
          sendToAnotherRecipient: z.literal(false, {
            message:
              "app_gift-card-studio_admin.validation.manualForm.sendToAnotherRecipient.required" satisfies GiftCardStudioAdminAllKeys,
          }),
        }),
      ),
  )
  .superRefine((data, ctx) => {
    if (data.paymentType !== "payment-link") {
      return;
    }
    if (!data.paymentLinkAppId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentLinkAppId"],
        message:
          "app_gift-card-studio_admin.validation.manualForm.paymentLinkAppId.required" satisfies GiftCardStudioAdminAllKeys,
      });
    }
    if (
      (data.channel === "email" || data.channel === "sms") &&
      (!data.to || data.to.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to"],
        message:
          "app_gift-card-studio_admin.validation.manualForm.to.required" satisfies GiftCardStudioAdminAllKeys,
      });
    }
  });

type FormValues = z.infer<typeof manualPurchaseSchema>;
type PaymentLinkApp = { _id: string; name: string };

export const ManualPurchaseDialog: React.FC<{
  appId: string;
  open: boolean;
  designId?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (purchase?: PurchasedGiftCardListModel) => void;
}> = ({ appId, open, designId: initialDesignId, onOpenChange, onSuccess }) => {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const tAdmin = useI18n("admin");
  const tRoot = useI18n();
  const currencySymbol = useCurrencySymbol();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [paymentLinkApps, setPaymentLinkApps] = useState<PaymentLinkApp[]>([]);

  const [settings, setSettings] = useState<GiftCardStudioSettings | null>(null);
  const fetchSettings = useCallback(async () => {
    try {
      const s = await getSettings(appId);
      setSettings(s);
    } catch {
      setSettings(null);
    }
  }, [appId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void fetchSettings();
    void adminApi.payments
      .listPaymentLinkApps()
      .then((result) => setPaymentLinkApps(result.items))
      .catch(() => setPaymentLinkApps([]));
  }, [open, fetchSettings]);

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [fetchSettings, open]);

  const minAmount = settings?.minAmount ?? 5;
  const maxAmount = settings?.maxAmount ?? 100;

  const formSchema = useMemo(
    () =>
      manualPurchaseSchema.and(
        z.object({
          amountPurchased: z.coerce
            .number<number>(
              "app_gift-card-studio_admin.validation.manualForm.amountPurchased.positive" satisfies GiftCardStudioAdminAllKeys,
            )
            .positive(
              "app_gift-card-studio_admin.validation.manualForm.amountPurchased.positive" satisfies GiftCardStudioAdminAllKeys,
            )
            .min(minAmount, {
              message: t("validation.manualForm.amountPurchased.min", {
                min: minAmount,
              }),
            })
            .max(maxAmount, {
              message: t("validation.manualForm.amountPurchased.max", {
                max: maxAmount,
              }),
            }),
        }),
      ),
    [minAmount, maxAmount, t],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      designId: initialDesignId ?? "",
      amountPurchased: 50,
      customerId: "",
      paymentType: "cash",
      channel: "copy",
      sendCustomerEmail: true,
      sendRecipientEmail: true,
      sendToAnotherRecipient: false,
    },
    mode: "all",
    reValidateMode: "onChange",
  });

  const designId = form.watch("designId");
  const amountPurchased = form.watch("amountPurchased");
  const toName = form.watch("toName");
  const message = form.watch("message");
  const toEmail = form.watch("toEmail");
  const sendToAnotherRecipient = form.watch("sendToAnotherRecipient");
  const paymentType = form.watch("paymentType");
  const channel = form.watch("channel");
  const [customer, setCustomer] = useState<CustomerListModel | undefined>(
    undefined,
  );

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
    if (paymentLinkApps.length === 1) {
      form.setValue("paymentLinkAppId", paymentLinkApps[0]._id);
    }
  }, [paymentLinkApps, form]);

  useEffect(() => {
    if (paymentType !== "payment-link") {
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
  }, [paymentType, channel, destinations, form]);

  const previewPayload: GetPreviewPayload | null = useMemo(() => {
    if (!designId || !amountPurchased) {
      return null;
    }

    return {
      designId,
      amount: amountPurchased,
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      toName: sendToAnotherRecipient ? toName : (customer?.name ?? ""),
      toEmail: sendToAnotherRecipient ? toEmail : (customer?.email ?? ""),
      message: message,
    };
  }, [
    designId,
    amountPurchased,
    toName,
    toEmail,
    message,
    customer,
    sendToAnotherRecipient,
  ]);

  const previewPayloadDebounced = useDebounce(previewPayload, 300);

  const fetchPreview = useCallback(async () => {
    if (!appId || !previewPayloadDebounced) {
      setPreviewUrl(null);
      return;
    }
    setPreviewLoading(true);
    try {
      const result = await getPreviewImage(appId, previewPayloadDebounced);
      if (result.success && result.imageDataUrl) {
        setPreviewUrl(result.imageDataUrl);
      } else {
        setPreviewUrl(null);
      }
    } catch {
      setPreviewUrl(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [appId, previewPayloadDebounced]);

  useEffect(() => {
    if (open) {
      fetchPreview();
    }
  }, [fetchPreview, open]);

  const onSubmit = async (values: FormValues) => {
    if (!customer) {
      return;
    }

    try {
      setLoading(true);
      const purchase = await toastPromise(
        createPurchasedGiftCard(appId, {
          designId: values.designId,
          amountPurchased: values.amountPurchased,
          customerId: values.customerId,
          toName: values.sendToAnotherRecipient ? values.toName : customer.name,
          toEmail: values.sendToAnotherRecipient
            ? values.toEmail
            : customer.email,
          message: values.message,
          paymentType: values.paymentType,
          paymentLinkAppId: values.paymentLinkAppId,
          channel: values.channel,
          to: values.to,
          sendCustomerEmail: values.sendCustomerEmail,
          sendRecipientEmail: sendToAnotherRecipient
            ? values.sendRecipientEmail
            : false,
        }),
        {
          success: t("purchases.manualForm.toast.success"),
          error: t("purchases.manualForm.toast.error"),
        },
      );
      handleOpenChange(false);
      form.reset();
      setPreviewUrl(null);
      onSuccess?.(purchase);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
      setPreviewUrl(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("app.pages.purchasesNew.title")}</DialogTitle>
          <DialogDescription>
            {t("app.pages.purchasesNew.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="manual-purchase-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-6 sm:grid-cols-[1fr,280px]">
              <FormField
                control={form.control}
                name="designId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("purchases.manualForm.design")}</FormLabel>
                    <FormControl>
                      <DesignSelector
                        appId={appId}
                        value={field.value}
                        onItemSelect={field.onChange}
                        disabled={loading}
                        includeArchived
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amountPurchased"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("purchases.manualForm.amount")}</FormLabel>
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
                            disabled={loading}
                            className={InputGroupInputClasses({
                              variant: "prefix",
                            })}
                            onChange={(e) => {
                              const v = e.target.valueAsNumber;
                              field.onChange(Number.isFinite(v) ? v : 0);
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
                    <FormLabel>{t("purchases.manualForm.customer")}</FormLabel>
                    <FormControl>
                      <CustomerSelector
                        value={field.value}
                        onItemSelect={field.onChange}
                        allowClear={false}
                        onValueChange={setCustomer}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("purchases.manualForm.paymentType")}
                    </FormLabel>
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
                          <SelectValue
                            placeholder={t("purchases.manualForm.paymentType")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {inPersonPaymentMethod.map((method) => (
                            <SelectItem key={method} value={method}>
                              {tAdmin(`common.labels.paymentMethod.${method}`)}
                            </SelectItem>
                          ))}
                          {paymentLinkApps.length > 0 && (
                            <SelectItem value="payment-link">
                              {tAdmin(
                                "common.labels.paymentMethod.payment-link",
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
              {paymentType === "payment-link" && (
                <>
                  {paymentLinkApps.length >= 2 && (
                    <FormField
                      control={form.control}
                      name="paymentLinkAppId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {tAdmin(
                              "payment.addUpdatePayment.form.paymentLinkAppId.label",
                            )}
                          </FormLabel>
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
                          {tAdmin(
                            "payment.addUpdatePayment.form.channel.label",
                          )}
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
                                {tAdmin(
                                  "payment.addUpdatePayment.form.channel.email",
                                )}
                              </SelectItem>
                              <SelectItem
                                value="sms"
                                disabled={phoneDestinations.length === 0}
                              >
                                {tAdmin(
                                  "payment.addUpdatePayment.form.channel.sms",
                                )}
                              </SelectItem>
                              <SelectItem value="copy">
                                {tAdmin(
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
                            {tAdmin("payment.addUpdatePayment.form.to.label")}
                          </FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="sendToAnotherRecipient"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">
                    {t("purchases.manualForm.sendToAnotherRecipient")}
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            {sendToAnotherRecipient && (
              <div className="grid gap-6 sm:grid-cols-[1fr,280px]">
                <FormField
                  control={form.control}
                  name="toName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("purchases.manualForm.toName")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={loading}
                          onBlur={() => {
                            field.onBlur();
                            form.trigger("sendToAnotherRecipient");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="toEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("purchases.manualForm.toEmail")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          {...field}
                          disabled={loading}
                          onBlur={() => {
                            field.onBlur();
                            form.trigger("sendToAnotherRecipient");
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("purchases.manualForm.message")}</FormLabel>
                  <FormControl>
                    <Textarea autoResize {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-6 sm:grid-cols-[1fr,280px]">
              <FormField
                control={form.control}
                name="sendCustomerEmail"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      {t("purchases.manualForm.sendCustomerEmail")}
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {sendToAnotherRecipient && (
                <FormField
                  control={form.control}
                  name="sendRecipientEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">
                        {t("purchases.manualForm.sendRecipientEmail")}
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-6 w-full">
              <h3 className="text-sm font-medium text-foreground">
                {t("purchases.table.detail.preview")}
              </h3>
              <div className="rounded-lg border border-border bg-muted/30 flex items-center justify-center min-h-[200px] w-full overflow-hidden">
                {previewLoading ? (
                  <Spinner className="text-muted-foreground" />
                ) : previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Gift card preview"
                    className="max-w-full max-h-[280px] object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground px-4 text-center">
                    {t("purchases.manualForm.previewPlaceholder")}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary" disabled={loading}>
                  {tAdmin("common.buttons.close")}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form="manual-purchase-form"
                disabled={loading}
              >
                {loading ? <Spinner className="w-4 h-4" /> : null}
                {t("purchases.table.actions.create")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
