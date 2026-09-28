"use client";

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
} from "@hacado/ui";
import { CheckCircle2, ChevronLeft, Gift } from "lucide-react";
import { forwardRef, type MouseEvent, type ReactNode } from "react";
import { DEFAULT_MAX_AMOUNT, DEFAULT_MIN_AMOUNT } from "../../const";
import type { GiftCardPurchaseState } from "../gift-card-purchase/use-gift-card-purchase";
import { visibleAmountPresets } from "./presets";

const MESSAGE_MAX_LENGTH = 250;

export const GiftCardPurchaseShowcaseView = forwardRef<
  HTMLDivElement,
  {
    purchase: GiftCardPurchaseState;
    className?: string;
    id?: string;
    onClick?: (event: MouseEvent<HTMLDivElement>) => void;
    hideTitle?: boolean | null;
    hideSteps?: boolean | null;
    previewPosition: "left" | "right";
    abovePreviewFirstOnMobile?: boolean;
    amountPresets: number[];
    title: ReactNode;
    abovePreview: ReactNode;
    belowPreview: ReactNode;
    isEditor?: boolean;
  }
>(
  (
    {
      purchase,
      className,
      id,
      onClick,
      hideTitle,
      hideSteps,
      previewPosition,
      abovePreviewFirstOnMobile = true,
      amountPresets,
      title,
      abovePreview,
      belowPreview,
      isEditor,
    },
    ref,
  ) => {
    const {
      i18n,
      isLoading,
      isSuccess,
      designs,
      currentStep,
      stepIndex,
      steps,
      appId,
    } = purchase;
    const hasNoDesigns = !!appId && !isLoading && designs.length === 0;
    const previewFirstOnWide = previewPosition === "left";

    return (
      <div
        ref={ref}
        id={id}
        onClick={onClick}
        className={cn(
          "gift-card-showcase mx-auto w-full max-w-6xl @container/gift-card-showcase [contain:layout]",
          className,
        )}
      >
        {!hideTitle && <div className="mb-8 text-center">{title}</div>}

        {!isSuccess && !hideSteps && (
          <Stepper
            steps={steps}
            currentStepId={currentStep}
            isCompleted={(stepId, index) => index < stepIndex}
            className="mb-8"
          />
        )}

        <div
          className={cn(
            "grid grid-cols-1 gap-8 @3xl/gift-card-showcase:grid-cols-2 @3xl/gift-card-showcase:items-start @3xl/gift-card-showcase:gap-x-10 @3xl/gift-card-showcase:gap-y-6",
          )}
        >
          <div
            className={cn(
              "min-w-0",
              abovePreviewFirstOnMobile ? "order-1" : "order-2",
              previewFirstOnWide
                ? "@3xl/gift-card-showcase:col-start-1 @3xl/gift-card-showcase:row-start-1"
                : "@3xl/gift-card-showcase:col-start-2 @3xl/gift-card-showcase:row-start-1",
            )}
          >
            {abovePreview}
          </div>

          <div
            className={cn(
              "min-w-0",
              abovePreviewFirstOnMobile ? "order-2" : "order-1",
              previewFirstOnWide
                ? "@3xl/gift-card-showcase:col-start-2 @3xl/gift-card-showcase:row-start-1 @3xl/gift-card-showcase:row-span-2"
                : "@3xl/gift-card-showcase:col-start-1 @3xl/gift-card-showcase:row-start-1 @3xl/gift-card-showcase:row-span-2",
            )}
          >
            <div className="relative rounded-2xl border bg-card p-5 shadow-sm @container/gift-card-form @md/gift-card-form:p-8">
              <PurchaseCard
                purchase={purchase}
                amountPresets={amountPresets}
                hasNoDesigns={hasNoDesigns}
                isEditor={isEditor}
              />
              {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Spinner className="h-8 w-8 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {i18n("common.aria.loading")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "order-3 flex min-w-0 flex-col gap-6",
              previewFirstOnWide
                ? "@3xl/gift-card-showcase:col-start-1 @3xl/gift-card-showcase:row-start-2"
                : "@3xl/gift-card-showcase:col-start-2 @3xl/gift-card-showcase:row-start-2",
            )}
          >
            <PreviewFrame purchase={purchase} hasNoDesigns={hasNoDesigns} />
            {belowPreview}
          </div>
        </div>
      </div>
    );
  },
);

const PreviewFrame = ({
  purchase,
  hasNoDesigns,
}: {
  purchase: GiftCardPurchaseState;
  hasNoDesigns: boolean;
}) => {
  const { t, previewUrl, previewLoading, previewError, isLoading, appId } =
    purchase;
  const message = !appId
    ? t("block.errors.noAppId")
    : hasNoDesigns
      ? t("block.showcase.noDesign")
      : previewError
        ? t("block.details.previewError")
        : t("block.details.previewPlaceholder");

  const showStatus = !previewUrl && !isLoading && !previewLoading;

  return (
    <div className="relative aspect-[8/5] w-full overflow-hidden rounded-2xl bg-muted shadow-sm">
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={t("block.details.preview")}
          className="h-full w-full object-contain"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          {isLoading || previewLoading ? (
            <Spinner className="h-6 w-6 text-muted-foreground" />
          ) : (
            <Gift className="h-8 w-8 text-muted-foreground/70" />
          )}
          {showStatus && (
            <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      )}
      {previewUrl && previewLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40">
          <Spinner className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

const PurchaseCard = ({
  purchase,
  amountPresets,
  hasNoDesigns,
  isEditor,
}: {
  purchase: GiftCardPurchaseState;
  amountPresets: number[];
  hasNoDesigns: boolean;
  isEditor?: boolean;
}) => {
  const {
    t,
    appId,
    isSuccess,
    currentStep,
    currencyFormat,
    amount,
    payment,
    PaymentForm,
    handleSubmit,
    handleNewPurchase,
    setCurrentStep,
    isLoading,
  } = purchase;

  if (!appId) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("block.errors.noAppId")}
      </p>
    );
  }

  if (isSuccess) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          {t("block.success.title")}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {t("block.success.description")}
        </p>
        <Button variant="outline" onClick={handleNewPurchase}>
          {t("block.success.newPurchaseButton")}
        </Button>
      </div>
    );
  }

  if (currentStep === "payment") {
    return (
      <div className="space-y-6">
        <div className="mb-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {currencyFormat(payment?.amount ?? amount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("block.payment.total")}
          </p>
        </div>
        {PaymentForm && (
          <PaymentForm
            {...payment?.formProps}
            intent={payment?.intent}
            onSubmit={handleSubmit}
            className={cn("payment-form", payment?.formProps?.className)}
          />
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep("details")}
          disabled={isLoading}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("block.buttons.back")}
        </Button>
      </div>
    );
  }

  return (
    <DetailsStep
      purchase={purchase}
      amountPresets={amountPresets}
      hasNoDesigns={hasNoDesigns}
      isEditor={isEditor}
    />
  );
};

const DetailsStep = ({
  purchase,
  amountPresets,
  hasNoDesigns,
  isEditor,
}: {
  purchase: GiftCardPurchaseState;
  amountPresets: number[];
  hasNoDesigns: boolean;
  isEditor?: boolean;
}) => {
  const {
    t,
    form,
    designs,
    amount,
    amountLimits,
    currencyFormat,
    sendToSomeoneElse,
    isLoading,
    isValid,
    handleGoToPayment,
  } = purchase;
  const disabled = isLoading || hasNoDesigns;
  const shownPresets = visibleAmountPresets(
    amountPresets,
    amountLimits?.minAmount ?? DEFAULT_MIN_AMOUNT,
    amountLimits?.maxAmount ?? DEFAULT_MAX_AMOUNT,
  );

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        {hasNoDesigns && (
          <p className="text-sm text-muted-foreground">
            {t("block.showcase.noDesign")}
          </p>
        )}

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
                    onValueChange={(value) => {
                      field.onChange(value);
                      field.onBlur();
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("block.details.design")} />
                    </SelectTrigger>
                    <SelectContent>
                      {designs.map((design) => (
                        <SelectItem key={design._id} value={design._id}>
                          {design.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            1. {t("block.showcase.sections.amount")}
          </p>
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <InputGroup>
                    <InputGroupAddon
                      className={InputGroupAddonClasses({ variant: "prefix" })}
                    >
                      {purchase.currencySymbol}
                    </InputGroupAddon>
                    <InputGroupInput>
                      <Input
                        {...field}
                        type="number"
                        disabled={disabled}
                        min={amountLimits?.minAmount ?? DEFAULT_MIN_AMOUNT}
                        max={amountLimits?.maxAmount ?? DEFAULT_MAX_AMOUNT}
                        step={1}
                        onChange={(event) => {
                          const value = event.target.valueAsNumber;
                          field.onChange(Number.isFinite(value) ? value : 0);
                        }}
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
          {shownPresets.length > 0 && (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={t("block.showcase.presetsLabel")}
            >
              {shownPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={amount === preset}
                  disabled={disabled}
                  onClick={() => {
                    form.setValue("amount", preset, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  className={cn(
                    "h-10 min-w-[4.75rem] flex-1 rounded-md border bg-background px-3 text-sm text-foreground",
                    "hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
                    amount === preset && "border-2 border-foreground",
                  )}
                >
                  {currencyFormat(preset)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">
            2. {t("block.showcase.sections.recipient")}
          </p>
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
                  <Input {...field} disabled={disabled} />
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
                  <Input {...field} disabled={disabled} />
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
                    disabled={disabled}
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
                      onCheckedChange={(value) => {
                        field.onChange(!!value);
                        form.trigger("toName");
                        form.trigger("toEmail");
                      }}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormLabel>{t("block.details.sendToSomeoneElse")}</FormLabel>
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
                        disabled={disabled}
                        onChange={(event) => {
                          field.onChange(event);
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
                        disabled={disabled}
                        onChange={(event) => {
                          field.onChange(event);
                          form.trigger("sendToSomeoneElse");
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("block.details.toEmailDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            3. {t("block.showcase.sections.message")}
          </p>
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    autoResize
                    rows={4}
                    maxLength={MESSAGE_MAX_LENGTH}
                    placeholder={t("block.showcase.messagePlaceholder")}
                    {...field}
                    disabled={disabled}
                    className="min-h-24"
                  />
                </FormControl>
                <p className="text-right text-xs text-muted-foreground">
                  {t("block.showcase.messageCount", {
                    count: (field.value ?? "").length,
                    max: MESSAGE_MAX_LENGTH,
                  })}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="button"
          className="h-12 w-full text-base"
          onClick={handleGoToPayment}
          disabled={disabled || !isValid || isEditor}
        >
          {t("block.buttons.continueToPayment")}
        </Button>
      </form>
    </Form>
  );
};
