"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@timelish/i18n/client";
import { CollectPayment, IdName } from "@timelish/types";
import {
  Button,
  Checkbox,
  cn,
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
  PhoneInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  Stepper,
  Textarea,
  toast,
  useCurrencyFormat,
  useCurrencySymbol,
  useDebounce,
} from "@timelish/ui";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gift,
} from "lucide-react";
import React, { forwardRef, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PaymentAppForms } from "../../../../payment-forms";
import { DEFAULT_MAX_AMOUNT, DEFAULT_MIN_AMOUNT } from "../../const";
import {
  GetAmountLimitsResponse,
  giftCardPuchaseFormSchema,
  GiftCardPurchaseFormPayload,
} from "../../models/public";
import {
  GiftCardStudioPublicKeys,
  GiftCardStudioPublicNamespace,
  giftCardStudioPublicNamespace,
} from "../../translations/types";
import {
  createOrUpdateIntent,
  fetchPreview,
  getInitOptions,
  purchaseGiftCard,
} from "./actions";

const STEPS = ["details", "payment"] as const;

export const GiftCardPurchaseBlockReader = forwardRef<
  HTMLDivElement,
  {
    appId: string | null | undefined;
    className: string;
    hideTitle?: boolean | null;
    hideSteps?: boolean | null;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    id?: string;
    isEditor?: boolean;
  }
>(({ appId, className, hideTitle, hideSteps, onClick, id, isEditor }, ref) => {
  const t = useI18n<GiftCardStudioPublicNamespace, GiftCardStudioPublicKeys>(
    giftCardStudioPublicNamespace,
  );

  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const currencySymbol = useCurrencySymbol();

  const [currentStep, setCurrentStep] =
    useState<(typeof STEPS)[number]>("details");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [isSuccess, setIsSuccess] = useState(false);

  const [payment, setPayment] = useState<CollectPayment | null>(null);
  const PaymentForm = useMemo(
    () =>
      payment?.intent?.appName ? PaymentAppForms[payment.intent.appName] : null,
    [payment],
  );

  const [amountLimits, setAmountLimits] =
    useState<GetAmountLimitsResponse | null>(null);
  const [designs, setDesigns] = useState<IdName[]>([]);
  useEffect(() => {
    const fetchAmountLimits = async () => {
      if (!appId) return;
      try {
        setIsLoading(true);
        const res = await getInitOptions(appId);
        setAmountLimits(res.amountLimits);
        setDesigns(res.designs);

        if (res.designs.length === 1) {
          form.setValue("designId", res.designs[0]._id);
        }
      } catch (e: any) {
        console.error(e);
        setDesigns([]);
        setAmountLimits({
          minAmount: DEFAULT_MIN_AMOUNT,
          maxAmount: DEFAULT_MAX_AMOUNT,
        } satisfies GetAmountLimitsResponse);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAmountLimits();
  }, [appId]);

  const formSchema = useMemo(() => {
    return giftCardPuchaseFormSchema.superRefine((data, ctx) => {
      if (data.amount < (amountLimits?.minAmount ?? DEFAULT_MIN_AMOUNT)) {
        ctx.addIssue({
          path: ["amount"],
          code: z.ZodIssueCode.custom,
          message: t("validation.purchase.amount.min", {
            min: amountLimits?.minAmount ?? DEFAULT_MIN_AMOUNT,
          }),
        });
      }
      if (data.amount > (amountLimits?.maxAmount ?? DEFAULT_MAX_AMOUNT)) {
        ctx.addIssue({
          path: ["amount"],
          code: z.ZodIssueCode.custom,
          message: t("validation.purchase.amount.max", {
            max: amountLimits?.maxAmount ?? DEFAULT_MAX_AMOUNT,
          }),
        });
      }
    });
  }, [amountLimits, t]);

  const form = useForm<GiftCardPurchaseFormPayload>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      designId: "",
      amount: 50,
      name: "",
      email: "",
      sendToSomeoneElse: false,
    },
    mode: "all",
    reValidateMode: "onChange",
  });

  const amount = form.watch("amount");
  const designId = form.watch("designId");
  const fromName = form.watch("name");
  const toName = form.watch("toName");
  const message = form.watch("message");
  const sendToSomeoneElse = form.watch("sendToSomeoneElse");

  const isValid = form.formState.isValid;

  const debouncedPreviewPayload = useDebounce(
    { designId, amount, fromName, toName, message },
    1000,
  );

  useEffect(() => {
    const fetchPreviewFn = async () => {
      if (
        !appId ||
        !debouncedPreviewPayload.amount ||
        !debouncedPreviewPayload.designId
      )
        return;

      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewUrl(null);
      try {
        const res = await fetchPreview(appId, debouncedPreviewPayload);

        if (res.success) {
          setPreviewUrl(res.imageDataUrl);
        } else {
          setPreviewError(res.code);
        }
      } catch (e: any) {
        console.error(e);
        setPreviewError(e.toString());
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreviewFn();
  }, [
    appId,
    debouncedPreviewPayload.amount,
    debouncedPreviewPayload.designId,
    debouncedPreviewPayload.fromName,
    debouncedPreviewPayload.toName,
    debouncedPreviewPayload.message,
  ]);

  const stepIndex = STEPS.indexOf(currentStep);
  const steps = [
    { id: "details", label: t("block.steps.details"), icon: Gift },
    { id: "payment", label: t("block.steps.payment"), icon: CreditCard },
  ];

  const handleGoToPayment = async () => {
    const email = form.getValues("email");
    const phone = form.getValues("phone");
    if (
      !appId ||
      isEditor ||
      !amount ||
      !designId ||
      !fromName ||
      !email ||
      !phone
    )
      return;

    try {
      setIsLoading(true);
      const res = await createOrUpdateIntent(appId, {
        amount,
        name: fromName,
        email,
        phone,
        intentId: payment?.intent?._id,
      });

      if (res) {
        setPayment(res);
        setCurrentStep("payment");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(t("block.errors.createOrUpdateIntentFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const formValues = form.getValues();
    if (
      !appId ||
      isEditor ||
      !formValues.amount ||
      !formValues.designId ||
      !formValues.name ||
      !formValues.email ||
      !formValues.phone ||
      !payment?.intent?._id
    )
      return;

    try {
      setIsLoading(true);
      const res = await purchaseGiftCard(appId, {
        amount: formValues.amount,
        designId: formValues.designId,
        name: formValues.name,
        email: formValues.email,
        phone: formValues.phone,
        intentId: payment?.intent?._id,
        sendToSomeoneElse: formValues.sendToSomeoneElse,
        toName: formValues.sendToSomeoneElse
          ? formValues.toName
          : formValues.name,
        toEmail: formValues.sendToSomeoneElse
          ? formValues.toEmail
          : formValues.email,
        message: formValues.message,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        toast.error(t("block.errors.purchaseFailed"));
      }
    } catch (e: any) {
      console.error(e);
      toast.error(t("block.errors.purchaseFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPurchase = () => {
    setIsSuccess(false);
    form.reset();
    if (designs.length === 1) {
      form.setValue("designId", designs[0]._id);
    }

    setPreviewUrl(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setIsLoading(false);
    setIsSuccess(false);
    setPayment(null);
    setCurrentStep("details");
  };

  if (!appId) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground",
          className,
        )}
        onClick={onClick}
        ref={ref}
        id={id}
      >
        {t("block.errors.noAppId")}
      </div>
    );
  }

  if (!isLoading && designs.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground",
          className,
        )}
        onClick={onClick}
        ref={ref}
        id={id}
      >
        {t("block.errors.noDesigns")}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-w-3xl mx-auto w-full gift-card-purchase-container",
        className,
      )}
      onClick={onClick}
      ref={ref}
      id={id}
    >
      {!hideTitle && (
        <div className="text-center space-y-2 mb-8 title-container">
          <h1 className="text-xl font-semibold text-foreground mb-2 title-text">
            {t("block.title")}
          </h1>
          <p className="text-sm text-muted-foreground description-text">
            {t("block.description")}
          </p>
        </div>
      )}

      {!isSuccess && !hideSteps && (
        <Stepper
          steps={steps}
          currentStepId={currentStep}
          isCompleted={(id, index) => index < stepIndex}
          className="mb-8"
        />
      )}

      <div className="relative  mb-6 w-full gift-card-purchase-steps-container">
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("block.success.title")}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("block.success.description")}
            </p>
            <div className="mt-6 confirm-new-booking-button-container">
              <Button
                onClick={handleNewPurchase}
                variant="outline"
                className="confirm-new-booking-button"
              >
                {t("block.success.newPurchaseButton")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {currentStep === "details" && (
              <div className="space-y-4 w-full gift-card-purchase-details-container">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) => {
                      console.log(data);
                    })}
                    className="space-y-4"
                  >
                    {designs.length > 1 && (
                      <FormField
                        control={form.control}
                        name="designId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("block.details.design")}
                              <span className="ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(v) => {
                                  field.onChange(v);
                                  field.onBlur();
                                }}
                                disabled={isLoading}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("block.details.design")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {designs.map((design) => (
                                    <SelectItem
                                      key={design._id}
                                      value={design._id}
                                    >
                                      {design.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("block.details.amount")}
                            <span className="ml-1">*</span>
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
                                  type="number"
                                  disabled={isLoading}
                                  onChange={(e) => {
                                    const v = e.target.valueAsNumber;
                                    field.onChange(Number.isFinite(v) ? v : 0);
                                  }}
                                  min={
                                    amountLimits?.minAmount ??
                                    DEFAULT_MIN_AMOUNT
                                  }
                                  max={
                                    amountLimits?.maxAmount ??
                                    DEFAULT_MAX_AMOUNT
                                  }
                                  step={1}
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
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("block.details.yourName")}
                            <span className="ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("block.details.email")}
                            <span className="ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("block.details.phone")}
                            <span className="ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <PhoneInput
                              {...field}
                              label={t("block.details.phone")}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sendToSomeoneElse"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(v) => {
                                  field.onChange(!!v);
                                  form.trigger("toName");
                                  form.trigger("toEmail");
                                }}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormLabel>
                              {t("block.details.sendToSomeoneElse")}
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {sendToSomeoneElse && (
                      <>
                        <FormField
                          control={form.control}
                          name="toName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("block.details.toName")}
                                <span className="ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isLoading}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    form.trigger("sendToSomeoneElse");
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
                              <FormLabel>
                                {t("block.details.toEmail")}
                                <span className="ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isLoading}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    form.trigger("sendToSomeoneElse");
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                {" "}
                                {t("block.details.toEmailDescription")}{" "}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("block.details.message")}</FormLabel>
                          <FormControl>
                            <Textarea
                              autoResize
                              placeholder={t(
                                "block.details.messagePlaceholder",
                              )}
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>

                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    {t("block.details.preview")}
                  </p>
                  {previewUrl && !previewLoading ? (
                    <img
                      src={previewUrl}
                      alt={t("block.details.preview")}
                      className="max-w-full object-contain rounded border"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-xs bg-muted/30 rounded-lg p-4 text-muted-foreground">
                      {previewLoading ? (
                        <>
                          <Spinner className="w-4 h-4 text-muted-foreground" />
                          {t("block.details.previewLoading")}
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {previewError
                              ? t("block.details.previewError")
                              : t("block.details.previewPlaceholder")}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === "payment" && (
              <div className="space-y-6 payment-card card-container">
                <div className="border rounded-lg p-6">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {currencyFormat(payment?.amount ?? amount)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("block.payment.total")}
                    </p>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm payment-card-service-total">
                      <span className="text-muted-foreground payment-card-service-total-label">
                        {t("block.payment.total")}
                      </span>
                      <span className="text-foreground payment-card-service-total-amount">
                        {currencyFormat(payment?.amount ?? amount)}
                      </span>
                    </div>
                  </div>

                  {PaymentForm && (
                    <PaymentForm
                      {...payment?.formProps}
                      intent={payment?.intent}
                      onSubmit={handleSubmit}
                      className={cn(
                        "payment-card-form payment-form",
                        payment?.formProps?.className,
                      )}
                    />
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="w-8 h-8 text-primary" />
              <span className="text-sm text-muted-foreground">
                {i18n("common.aria.loading")}
              </span>
            </div>
          </div>
        )}
      </div>

      {!isSuccess && (
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card border rounded-lg p-4 mt-6 summary-container">
          {amount && typeof amount === "number" && (
            <div className="text-left">
              <p className="text-xs text-muted-foreground amount-label">
                {t("block.details.amount")}
              </p>
              <p className="text-sm font-bold text-foreground flex items-center gap-2 amount-value">
                {currencyFormat(amount)}
              </p>
            </div>
          )}
          <div
            className={cn(
              "w-full lg:w-auto flex justify-between gap-2 buttons-container",
              amount &&
                typeof amount === "number" &&
                "border-t pt-2 md:border-t-0 md:border-l md:pl-2 md:pt-0",
            )}
          >
            {currentStep === "payment" && (
              <Button
                variant="outline"
                className="back-button"
                onClick={() => setCurrentStep("details")}
                disabled={isLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t("block.buttons.back")}
              </Button>
            )}
            {currentStep === "details" && (
              <Button
                className="next-button"
                onClick={handleGoToPayment}
                disabled={isLoading || !isValid || isEditor}
              >
                {t("block.buttons.continueToPayment")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
