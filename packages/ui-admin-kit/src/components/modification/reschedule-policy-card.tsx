"use client";

import { useI18n, useLocale } from "@timelish/i18n/client";
import {
  appointmentReschedulePolicyActionType,
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

export const ReschedulePolicyCardContent: React.FC<
  {
    basePath: string;
    form: UseFormReturn<any>;
    disabled?: boolean;
  } & ({ default: true; index?: never } | { default?: false; index: number })
> = ({ form, disabled, default: isDefault, index, basePath }) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();
  const path = isDefault
    ? `${basePath}.defaultPolicy`
    : (`${basePath}.policies.${index}` as const);

  const isPaymentRequired = form.watch(`${path}.action`) === "paymentRequired";
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
                  "cancellationsAndReschedules.reschedulePolicy.minutesToAppointment.label",
                )}
                <InfoTooltip>
                  {t(
                    "cancellationsAndReschedules.reschedulePolicy.minutesToAppointment.tooltip",
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
              {t("cancellationsAndReschedules.reschedulePolicy.action.label")}
              <InfoTooltip>
                {t(
                  "cancellationsAndReschedules.reschedulePolicy.action.tooltip",
                )}
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  field.onBlur();

                  if (value === "paymentRequired") {
                    form.setValue(`${path}.paymentType`, "percentage", {
                      shouldValidate: true,
                    });
                    form.setValue(`${path}.paymentPercentage`, 50, {
                      shouldValidate: true,
                    });
                  } else {
                    form.setValue(`${path}.paymentType`, undefined);
                    form.setValue(`${path}.paymentAmount`, undefined);
                    form.setValue(`${path}.paymentPercentage`, undefined);
                  }
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "cancellationsAndReschedules.reschedulePolicy.action.placeholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {appointmentReschedulePolicyActionType.map((action) => (
                    <SelectItem key={action} value={action}>
                      {t(
                        `cancellationsAndReschedules.reschedulePolicy.action.labels.${action}`,
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
      {isPaymentRequired && (
        <>
          <FormField
            control={form.control}
            name={`${path}.paymentType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t(
                    "cancellationsAndReschedules.reschedulePolicy.paymentType.label",
                  )}
                  <InfoTooltip>
                    {t(
                      "cancellationsAndReschedules.reschedulePolicy.paymentType.tooltip",
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
                        form.setValue(`${path}.paymentAmount`, 20, {
                          shouldValidate: true,
                        });
                      } else {
                        form.setValue(`${path}.paymentPercentage`, 50, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "cancellationsAndReschedules.reschedulePolicy.paymentType.placeholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {modificationPaymentCalculationType.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(
                            `cancellationsAndReschedules.reschedulePolicy.paymentType.labels.${type}`,
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
                      "cancellationsAndReschedules.reschedulePolicy.paymentAmount.label",
                    )}
                    <InfoTooltip>
                      {t(
                        "cancellationsAndReschedules.reschedulePolicy.paymentAmount.tooltip",
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
                          min={0}
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
                        "cancellationsAndReschedules.reschedulePolicy.calculateFromOriginalPrice.label",
                      )}
                      <InfoTooltip>
                        {t(
                          "cancellationsAndReschedules.reschedulePolicy.calculateFromOriginalPrice.tooltip",
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
                        "cancellationsAndReschedules.reschedulePolicy.paymentPercentage.label",
                      )}
                      <InfoTooltip>
                        {t(
                          "cancellationsAndReschedules.reschedulePolicy.paymentPercentage.tooltip",
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

export const ReschedulePolicyCard: React.FC<
  {
    remove: () => void;
    basePath: string;
    form: UseFormReturn<any>;
    disabled?: boolean;
  } & ({ default: true; index?: never } | { default?: false; index: number })
> = ({ form, disabled, default: isDefault, index, remove, basePath }) => {
  const t = useI18n("admin");
  const listLocale = useLocale();

  const path = isDefault
    ? `${basePath}.defaultPolicy`
    : (`${basePath}.policies.${index}` as const);
  const { isValid } = useFormState({ control: form.control, name: path });
  const minutesToAppointment = form.watch(
    `${path}.minutesToAppointment` as any,
  ) as number | null | undefined;

  const ruleAppliesDescription =
    (isDefault ?? false)
      ? t("cancellationsAndReschedules.reschedulePolicy.default.label")
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
            {t("cancellationsAndReschedules.reschedulePolicy.policy")}
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
                title={t("cancellationsAndReschedules.reschedulePolicy.remove")}
              >
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t(
                    "cancellationsAndReschedules.reschedulePolicy.deleteConfirmTitle",
                  )}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <p>
                    {t(
                      "cancellationsAndReschedules.reschedulePolicy.deleteReschedulePolicyConfirmDescription",
                    )}
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("cancellationsAndReschedules.reschedulePolicy.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction asChild variant="destructive">
                  <Button onClick={remove}>
                    {t("cancellationsAndReschedules.reschedulePolicy.delete")}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="py-6 grid grid-cols-1 gap-4 w-full relative">
        <ReschedulePolicyCardContent
          form={form}
          disabled={disabled}
          default={isDefault as any}
          index={index}
          basePath={basePath}
        />
      </CardContent>
    </Card>
  );
};
