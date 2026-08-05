import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import {
  isRequiredOptionTypes,
  optionPaymentCalculationType,
} from "@hacado/types";
import {
  Combobox,
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
} from "@hacado/ui";
import React from "react";
import { TabProps } from "./types";

export const PaymentsTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();

  const requireDeposit = form.watch("requireDeposit");
  const isAmountPaymentType = form.watch("paymentType") === "amount";

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name="requireDeposit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("services.options.form.paymentSettings.requireDeposit.label")}{" "}
              <InfoTooltip>
                <I18nRichText
                  namespace="admin"
                  text="services.options.form.paymentSettings.requireDeposit.tooltip"
                />
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <Combobox
                disabled={disabled}
                className="flex w-full font-normal text-lg"
                values={isRequiredOptionTypes.map((value) => ({
                  value,
                  label: t(
                    `services.options.form.paymentSettings.requireDeposit.${value}`,
                  ),
                }))}
                searchLabel={t("services.options.form.selectOption")}
                value={field.value || "inherit"}
                onItemSelect={(item) => {
                  field.onChange(item);
                  if (item === "always") {
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
                    form.setValue("depositPercentage", undefined as any, {
                      shouldValidate: true,
                    });
                  }

                  field.onBlur();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {requireDeposit === "always" && (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name={`paymentType`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.options.form.paymentSettings.paymentType.label")}
                  <InfoTooltip>
                    <I18nRichText
                      namespace="admin"
                      text="services.options.form.paymentSettings.paymentType.tooltip"
                    />
                  </InfoTooltip>
                </FormLabel>
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
                        form.setValue(`depositPercentage` as any, 50, {
                          shouldValidate: true,
                        });
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
                  <FormLabel>
                    {t(
                      "services.options.form.paymentSettings.depositAmount.label",
                    )}{" "}
                    <InfoTooltip>
                      <I18nRichText
                        namespace="admin"
                        text="services.options.form.paymentSettings.depositAmount.tooltip"
                      />
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
                  <FormLabel>
                    {t(
                      "services.options.form.paymentSettings.depositPercentage.label",
                    )}{" "}
                    <InfoTooltip>
                      <I18nRichText
                        namespace="admin"
                        text="services.options.form.paymentSettings.depositPercentage.tooltip"
                      />
                    </InfoTooltip>
                  </FormLabel>
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
                      <InputGroupAddon className={InputGroupAddonClasses()}>
                        %
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
};
