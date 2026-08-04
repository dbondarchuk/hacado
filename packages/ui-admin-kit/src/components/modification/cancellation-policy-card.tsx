"use client";

import { useI18n, useLocale } from "@timelish/i18n/client";
import {
  appointmentWithDepositCancellationPolicyActionType,
  appointmentWithoutDepositCancellationPolicyActionType,
  modificationPaymentCalculationType,
} from "@timelish/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  BooleanSelect,
  Button,
  Card,
  CardContent,
  CardHeader,
  cn,
  DurationInput,
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
  useCurrencySymbol,
} from "@timelish/ui";
import { Trash } from "lucide-react";
import React, { useEffect } from "react";
import { UseFormReturn, useFormState } from "react-hook-form";
import { formatTimeBeforeAppointmentRuleHeader } from "./time-before-appointment-rule-header";

function getPath<TDeposit extends boolean, TDefault extends boolean>(
  basePath: string,
  withDeposit: TDeposit,
  isDefault: TDefault,
  index: number,
) {
  return `${basePath}.${withDeposit ? "withDeposit" : "withoutDeposit"}.${isDefault ? "defaultPolicy" : `policies.${index}`}` as const as any;
}

export const CancellationPolicyCardContent: React.FC<
  {
    withDeposit: boolean;
    form: UseFormReturn<any>;
    disabled?: boolean;
    basePath: string;
  } & ({ default: true; index?: never } | { default?: false; index: number })
> = ({ form, disabled, default: isDefault, index, withDeposit, basePath }) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();

  const path = getPath(basePath, withDeposit, isDefault ?? false, index ?? 0);

  const action = form.watch(`${path}.action`);
  const isPartialRefund = action === "partialRefund";
  const isFullRefund = action === "fullRefund";
  const isPaymentRequired = action === "paymentRequired";
  const isPaymentAmountType = form.watch(`${path}.paymentType`) === "amount";

  return (
    <>
      {!isDefault && (
        <FormField
          control={form.control}
          name={`${path}.minutesToAppointment` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t(
                  "cancellationsAndReschedules.cancellationPolicy.minutesToAppointment.label",
                )}
                <InfoTooltip>
                  {t(
                    "cancellationsAndReschedules.cancellationPolicy.minutesToAppointment.tooltip",
                  )}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <DurationInput
                  type="weeks-days-hours-minutes"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={form.control}
        name={`${path}.action`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("cancellationsAndReschedules.cancellationPolicy.action.label")}
              <InfoTooltip>
                {t(
                  "cancellationsAndReschedules.cancellationPolicy.action.tooltip",
                )}
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  field.onBlur();

                  if (withDeposit && value === "partialRefund") {
                    form.setValue(`${path}.refundPercentage` as any, 50, {
                      shouldValidate: true,
                    });
                  } else if (value === "paymentRequired") {
                    form.setValue(`${path}.paymentType` as any, "percentage", {
                      shouldValidate: true,
                    });
                    form.setValue(`${path}.paymentAmount` as any, undefined);
                    form.setValue(`${path}.paymentPercentage` as any, 50, {
                      shouldValidate: true,
                    });
                  } else {
                    form.setValue(`${path}.refundPercentage` as any, undefined);
                    form.setValue(`${path}.paymentType` as any, undefined);
                    form.setValue(`${path}.paymentAmount` as any, undefined);
                    form.setValue(`${path}.refundPercentage` as any, undefined);
                    form.setValue(
                      `${path}.paymentPercentage` as any,
                      undefined,
                    );
                  }
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "cancellationsAndReschedules.cancellationPolicy.action.placeholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(withDeposit
                    ? appointmentWithDepositCancellationPolicyActionType
                    : appointmentWithoutDepositCancellationPolicyActionType
                  ).map((action) => (
                    <SelectItem key={action} value={action}>
                      {t(
                        `cancellationsAndReschedules.cancellationPolicy.action.labels.${action}`,
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
      {withDeposit && (isPartialRefund || isFullRefund) && (
        <FormField
          control={form.control}
          name={`${path}.refundFees` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t(
                  "cancellationsAndReschedules.cancellationPolicy.refundFees.label",
                )}
                <InfoTooltip>
                  {t(
                    "cancellationsAndReschedules.cancellationPolicy.refundFees.tooltip",
                  )}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <BooleanSelect
                  value={field.value ?? false}
                  onValueChange={(val) => {
                    field.onChange(val);
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      {withDeposit && isPartialRefund && (
        <FormField
          control={form.control}
          name={`${path}.refundPercentage` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t(
                  "cancellationsAndReschedules.cancellationPolicy.refundPercentage.label",
                )}
                <InfoTooltip>
                  {t(
                    "cancellationsAndReschedules.cancellationPolicy.refundPercentage.tooltip",
                  )}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <InputGroup>
                  <InputGroupInput>
                    <Input
                      {...field}
                      disabled={disabled}
                      type="number"
                      min={0}
                      max={100}
                      inputMode="decimal"
                      step={1}
                      className={InputGroupInputClasses({
                        variant: "suffix",
                      })}
                    />
                  </InputGroupInput>
                  <InputGroupAddon
                    className={InputGroupAddonClasses({
                      variant: "suffix",
                    })}
                  >
                    %
                  </InputGroupAddon>
                </InputGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      {isPaymentRequired && (
        <>
          <FormField
            control={form.control}
            name={`${path}.paymentType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t(
                    "cancellationsAndReschedules.cancellationPolicy.paymentType.label",
                  )}
                  <InfoTooltip>
                    {t(
                      "cancellationsAndReschedules.cancellationPolicy.paymentType.tooltip",
                    )}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      field.onBlur();

                      if (value === "amount") {
                        form.setValue(`${path}.paymentAmount` as any, 20, {
                          shouldValidate: true,
                        });
                      } else {
                        form.setValue(`${path}.paymentPercentage` as any, 50, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "cancellationsAndReschedules.cancellationPolicy.paymentType.placeholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {modificationPaymentCalculationType.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(
                            `cancellationsAndReschedules.cancellationPolicy.paymentType.labels.${type}`,
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
          {isPaymentAmountType ? (
            <FormField
              control={form.control}
              name={`${path}.paymentAmount`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "cancellationsAndReschedules.cancellationPolicy.paymentAmount.label",
                    )}
                    <InfoTooltip>
                      {t(
                        "cancellationsAndReschedules.cancellationPolicy.paymentAmount.tooltip",
                      )}
                    </InfoTooltip>
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
                          disabled={disabled}
                          type="number"
                          min={1}
                          inputMode="decimal"
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
          ) : (
            <>
              <FormField
                control={form.control}
                name={`${path}.calculateFromOriginalPrice` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "cancellationsAndReschedules.cancellationPolicy.calculateFromOriginalPrice.label",
                      )}
                      <InfoTooltip>
                        {t(
                          "cancellationsAndReschedules.cancellationPolicy.calculateFromOriginalPrice.tooltip",
                        )}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <BooleanSelect
                        value={field.value ?? false}
                        onValueChange={(val) => {
                          field.onChange(val);
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
                name={`${path}.paymentPercentage`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "cancellationsAndReschedules.cancellationPolicy.paymentPercentage.label",
                      )}
                      <InfoTooltip>
                        {t(
                          "cancellationsAndReschedules.cancellationPolicy.paymentPercentage.tooltip",
                        )}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput>
                          <Input
                            {...field}
                            disabled={disabled}
                            type="number"
                            min={0}
                            max={100}
                            inputMode="decimal"
                            step={1}
                            className={InputGroupInputClasses({
                              variant: "suffix",
                            })}
                          />
                        </InputGroupInput>
                        <InputGroupAddon
                          className={InputGroupAddonClasses({
                            variant: "suffix",
                          })}
                        >
                          %
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </>
      )}
    </>
  );
};

export const CancellationPolicyCard: React.FC<
  {
    remove: () => void;
    withDeposit: boolean;
    form: UseFormReturn<any>;
    disabled?: boolean;
    basePath: string;
  } & ({ default: true; index?: never } | { default?: false; index: number })
> = ({
  form,
  disabled,
  default: isDefault,
  index,
  remove,
  withDeposit,
  basePath,
}) => {
  const t = useI18n("admin");
  const listLocale = useLocale();

  const path = getPath(basePath, withDeposit, isDefault ?? false, index ?? 0);
  const { isValid } = useFormState({
    control: form.control,
    name: path,
  });

  const minutesToAppointment = form.watch(
    `${path}.minutesToAppointment` as any,
  ) as number | null | undefined;

  const ruleAppliesDescription =
    (isDefault ?? false)
      ? t("cancellationsAndReschedules.cancellationPolicy.default.label")
      : formatTimeBeforeAppointmentRuleHeader(
          minutesToAppointment,
          t,
          listLocale,
        );

  const value = form.watch(`${path}.minutesToAppointment`);
  useEffect(() => {
    if (value) {
      form.trigger(basePath as any);
    }
  }, [form, basePath, value]);

  return (
    <Card>
      <CardHeader className="justify-between relative flex flex-row border-b px-6 py-3 w-full items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span
            className={cn(
              "text-sm font-semibold uppercase tracking-wide text-muted-foreground",
              !isValid && "text-destructive",
            )}
          >
            {t("cancellationsAndReschedules.cancellationPolicy.policy")}
          </span>
          {!!minutesToAppointment && (
            <span
              className={cn(
                "text-sm font-medium leading-snug text-muted-foreground",
                !isValid && "text-destructive",
              )}
            >
              {ruleAppliesDescription}
            </span>
          )}
        </div>
        <div className="flex flex-row items-start">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={disabled}
                variant="ghost-destructive"
                size="icon"
                type="button"
                title={t(
                  "cancellationsAndReschedules.cancellationPolicy.remove",
                )}
              >
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t(
                    "cancellationsAndReschedules.cancellationPolicy.deleteConfirmTitle",
                  )}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <p>
                    {t(
                      "cancellationsAndReschedules.cancellationPolicy.deleteCancellationPolicyConfirmDescription",
                    )}
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("cancellationsAndReschedules.cancellationPolicy.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction asChild variant="destructive">
                  <Button onClick={remove}>
                    {t("cancellationsAndReschedules.cancellationPolicy.delete")}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="py-6 grid grid-cols-1 gap-4 w-full relative">
        <CancellationPolicyCardContent
          form={form}
          disabled={disabled}
          default={isDefault as any}
          index={index}
          withDeposit={withDeposit}
          basePath={basePath}
        />
      </CardContent>
    </Card>
  );
};
