import { TipPresetsField } from "@/components/admin/payments/tip-presets-field";
import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import {
  isRequiredOptionTypes,
  optionPaymentCalculationType,
  optionTipsModes,
} from "@hacado/types";
import {
  FormControl,
  FormDescription,
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
  useCurrencySymbol,
} from "@hacado/ui";
import { SwitchCardFormItem } from "@hacado/ui-admin";
import React from "react";
import { TabProps } from "./types";

export const PaymentsTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();

  const isAmountPaymentType = form.watch("paymentType") === "amount";

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="requireDeposit"
        render={({ field }) => {
          const customDeposit = (field.value || "inherit") !== "inherit";

          return (
            <SwitchCardFormItem
              label={t(
                "services.options.form.paymentSettings.customDeposit.label",
              )}
              description={t(
                "services.options.form.paymentSettings.customDeposit.tooltip",
              )}
              checked={customDeposit}
              disabled={disabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  field.onChange("always");
                  form.setValue("depositPercentage", 50, {
                    shouldValidate: true,
                  });
                  form.setValue("paymentType", "percentage", {
                    shouldValidate: true,
                  });
                } else {
                  field.onChange("inherit");
                  form.setValue("paymentType", undefined as any, {
                    shouldValidate: true,
                  });
                  form.setValue("depositAmount", undefined as any, {
                    shouldValidate: true,
                  });
                  form.setValue("depositPercentage", undefined as any, {
                    shouldValidate: true,
                  });
                }

                field.onBlur();
              }}
            >
              {customDeposit && (
                <>
                  <FormItem>
                    <FormLabel>
                      {t(
                        "services.options.form.paymentSettings.requireDeposit.label",
                      )}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? undefined}
                        disabled={disabled}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "always") {
                            form.setValue("depositPercentage", 50, {
                              shouldValidate: true,
                            });
                            form.setValue("paymentType", "percentage", {
                              shouldValidate: true,
                            });
                          } else {
                            form.setValue("paymentType", undefined as any, {
                              shouldValidate: true,
                            });
                            form.setValue("depositAmount", undefined as any, {
                              shouldValidate: true,
                            });
                            form.setValue(
                              "depositPercentage",
                              undefined as any,
                              {
                                shouldValidate: true,
                              },
                            );
                          }

                          field.onBlur();
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {isRequiredOptionTypes
                            .filter((value) => value !== "inherit")
                            .map((value) => (
                              <SelectItem key={value} value={value}>
                                {t(
                                  `services.options.form.paymentSettings.requireDeposit.${value}`,
                                )}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      <I18nRichText
                        namespace="admin"
                        text="services.options.form.paymentSettings.requireDeposit.tooltip"
                      />
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                  {field.value === "always" && (
                    <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`paymentType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabelWithRequiredIndicator required>
                              {t(
                                "services.options.form.paymentSettings.paymentType.label",
                              )}
                            </FormLabelWithRequiredIndicator>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);

                                  if (value === "amount") {
                                    form.setValue(`depositAmount` as any, 20, {
                                      shouldValidate: true,
                                    });
                                  } else {
                                    form.setValue(
                                      `depositPercentage` as any,
                                      50,
                                      {
                                        shouldValidate: true,
                                      },
                                    );
                                  }

                                  field.onBlur();
                                }}
                                disabled={disabled}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t(
                                      "services.options.form.paymentSettings.paymentType.placeholder",
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {optionPaymentCalculationType.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {t(
                                        `services.options.form.paymentSettings.paymentType.labels.${type}`,
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              <I18nRichText
                                namespace="admin"
                                text="services.options.form.paymentSettings.paymentType.tooltip"
                              />
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {isAmountPaymentType ? (
                        <FormField
                          control={form.control}
                          name="depositAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabelWithRequiredIndicator required>
                                {t(
                                  "services.options.form.paymentSettings.depositAmount.label",
                                )}
                              </FormLabelWithRequiredIndicator>
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
                                      disabled={disabled}
                                      placeholder="20"
                                      type="number"
                                      className={InputGroupInputClasses({
                                        variant: "prefix",
                                      })}
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        form.trigger("requireDeposit");
                                        form.trigger("paymentType");
                                      }}
                                    />
                                  </InputGroupInput>
                                </InputGroup>
                              </FormControl>
                              <FormDescription>
                                <I18nRichText
                                  namespace="admin"
                                  text="services.options.form.paymentSettings.depositAmount.tooltip"
                                />
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <FormField
                          control={form.control}
                          name="depositPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabelWithRequiredIndicator required>
                                {t(
                                  "services.options.form.paymentSettings.depositPercentage.label",
                                )}
                              </FormLabelWithRequiredIndicator>
                              <FormControl>
                                <InputGroup>
                                  <InputGroupInput>
                                    <Input
                                      disabled={disabled}
                                      placeholder="20"
                                      type="number"
                                      className={InputGroupInputClasses()}
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        form.trigger("requireDeposit");
                                        form.trigger("paymentType");
                                      }}
                                    />
                                  </InputGroupInput>
                                  <InputGroupAddon
                                    className={InputGroupAddonClasses()}
                                  >
                                    %
                                  </InputGroupAddon>
                                </InputGroup>
                              </FormControl>
                              <FormDescription>
                                <I18nRichText
                                  namespace="admin"
                                  text="services.options.form.paymentSettings.depositPercentage.tooltip"
                                />
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </SwitchCardFormItem>
          );
        }}
      />
      <FormField
        control={form.control}
        name="tipsMode"
        render={({ field }) => {
          const customTips = (field.value || "inherit") !== "inherit";
          const showTipPresets =
            field.value === "on" || field.value === "full-payment-only";

          return (
            <SwitchCardFormItem
              label={t(
                "services.options.form.paymentSettings.customTips.label",
              )}
              description={t(
                "services.options.form.paymentSettings.customTips.tooltip",
              )}
              checked={customTips}
              disabled={disabled}
              onCheckedChange={(checked) => {
                if (checked) {
                  field.onChange("on");
                  if (!(form.getValues("tipPresets") ?? []).length) {
                    form.setValue("tipPresets", [15, 18, 20], {
                      shouldValidate: true,
                    });
                  }
                } else {
                  field.onChange("inherit");
                  form.setValue("tipPresets", undefined as any, {
                    shouldValidate: true,
                  });
                }

                field.onBlur();
              }}
            >
              {customTips && (
                <>
                  <FormItem>
                    <FormLabel>
                      {t(
                        "services.options.form.paymentSettings.tipsMode.label",
                      )}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ?? undefined}
                        disabled={disabled}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "off") {
                            form.setValue("tipPresets", undefined as any, {
                              shouldValidate: true,
                            });
                          } else if (
                            !(form.getValues("tipPresets") ?? []).length
                          ) {
                            form.setValue("tipPresets", [15, 18, 20], {
                              shouldValidate: true,
                            });
                          }

                          field.onBlur();
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {optionTipsModes
                            .filter((mode) => mode !== "inherit")
                            .map((mode) => (
                              <SelectItem key={mode} value={mode}>
                                {t(
                                  `services.options.form.paymentSettings.tipsMode.values.${mode}`,
                                )}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      {t(
                        "services.options.form.paymentSettings.tipsMode.tooltip",
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                  {showTipPresets && (
                    <TipPresetsField
                      form={form}
                      name="tipPresets"
                      disabled={disabled}
                      labels={{
                        title: t(
                          "services.options.form.paymentSettings.tipPresets.label",
                        ),
                        description: t(
                          "services.options.form.paymentSettings.tipPresets.description",
                        ),
                        percentage: t(
                          "services.options.form.paymentSettings.tipPresets.percentage",
                        ),
                        move: t(
                          "services.options.form.paymentSettings.tipPresets.move",
                        ),
                        remove: t(
                          "services.options.form.paymentSettings.tipPresets.remove",
                        ),
                      }}
                    />
                  )}
                </>
              )}
            </SwitchCardFormItem>
          );
        }}
      />
    </div>
  );
};
