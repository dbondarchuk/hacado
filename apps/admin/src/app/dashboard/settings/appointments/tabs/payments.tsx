import { TipPresetsField } from "@/components/admin/payments/tip-presets-field";
import { FeatureUpgradeHint } from "@/lib/billing/feature-upgrade-hint";
import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import { bookingTipsModes } from "@hacado/types";
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
  RadioButtonGroup,
  RadioButtonGroupItem,
  useCurrencySymbol,
} from "@hacado/ui";
import { SwitchCardFormItem } from "@hacado/ui-admin";
import { TabProps } from "./types";

export const PaymentsTab: React.FC<TabProps & { canUsePayments?: boolean }> = ({
  form,
  disabled,
  canUsePayments = true,
}) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();
  const requireDeposit = form.watch("payments.requireDeposit");
  const tipsMode = form.watch("payments.tipsMode") ?? "off";

  if (!canUsePayments) {
    return (
      <div className="gap-2 grid grid-cols-1 md:grid-cols-2 md:gap-4 w-full">
        <FeatureUpgradeHint />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <FormField
        control={form.control}
        name="payments.requireDeposit"
        render={({ field }) => (
          <SwitchCardFormItem
            label={t("settings.appointments.form.payments.requireDeposit")}
            description={
              <I18nRichText
                namespace="admin"
                text="settings.appointments.form.payments.requireDepositTooltip"
              />
            }
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
            alwaysItemsStart
          >
            {requireDeposit && (
              <div className="flex flex-col gap-4 pt-4 border-t border-border">
                <FormField
                  control={form.control}
                  name="payments.depositPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabelWithRequiredIndicator
                        required={!!requireDeposit}
                      >
                        {t("settings.appointments.form.payments.depositAmount")}
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
                            />
                          </InputGroupInput>
                          <InputGroupAddon className={InputGroupAddonClasses()}>
                            %
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormDescription>
                        <I18nRichText
                          namespace="admin"
                          text="settings.appointments.form.payments.depositAmountTooltip"
                        />
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payments.dontRequireIfCompletedMinNumberOfAppointments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t(
                          "settings.appointments.form.payments.dontRequireIfCompletedMinNumberOfAppointments",
                        )}
                      </FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupInput>
                            <Input
                              disabled={disabled}
                              placeholder="3"
                              type="number"
                              className={InputGroupInputClasses()}
                              {...field}
                            />
                          </InputGroupInput>
                          <InputGroupAddon className={InputGroupAddonClasses()}>
                            {t(
                              "settings.appointments.form.payments.appointments",
                            )}
                          </InputGroupAddon>
                        </InputGroup>
                      </FormControl>
                      <FormDescription>
                        <I18nRichText
                          namespace="admin"
                          text="settings.appointments.form.payments.dontRequireIfCompletedMinNumberOfAppointmentsTooltip"
                        />
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </SwitchCardFormItem>
        )}
      />
      <FormField
        control={form.control}
        name="payments.fullPaymentAmountThreshold"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2 border p-4 rounded-lg w-full">
            <FormLabel>
              {t(
                "settings.appointments.form.payments.fullPaymentAmountThreshold",
              )}
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
                    placeholder="5.00"
                    type="number"
                    className={InputGroupInputClasses({
                      variant: "prefix",
                    })}
                    {...field}
                  />
                </InputGroupInput>
              </InputGroup>
            </FormControl>
            <FormDescription>
              <I18nRichText
                namespace="admin"
                text="settings.appointments.form.payments.fullPaymentAmountThresholdTooltip"
              />
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="payments.tipsMode"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2 border p-4 rounded-lg w-full">
            <FormLabel>
              {t("settings.appointments.form.payments.tipsMode.label")}
            </FormLabel>
            <FormControl>
              <RadioButtonGroup
                value={field.value}
                onValueChange={field.onChange}
                className="w-full"
                joined
              >
                {bookingTipsModes.map((mode) => (
                  <RadioButtonGroupItem
                    key={mode}
                    value={mode}
                    className="w-full"
                  >
                    {t(
                      `settings.appointments.form.payments.tipsMode.values.${mode}`,
                    )}
                  </RadioButtonGroupItem>
                ))}
              </RadioButtonGroup>
            </FormControl>
            <FormDescription>
              {t("settings.appointments.form.payments.tipsMode.tooltip")}
            </FormDescription>
            <FormMessage />

            {tipsMode !== "off" && (
              <TipPresetsField
                form={form}
                name="payments.tipPresets"
                disabled={disabled}
                className="flex flex-col gap-2 md:col-span-2"
                labels={{
                  title: t(
                    "settings.appointments.form.payments.tipPresets.label",
                  ),
                  description: t(
                    "settings.appointments.form.payments.tipPresets.description",
                  ),
                  percentage: t(
                    "settings.appointments.form.payments.tipPresets.percentage",
                  ),
                  move: t(
                    "settings.appointments.form.payments.tipPresets.move",
                  ),
                  remove: t(
                    "settings.appointments.form.payments.tipPresets.remove",
                  ),
                }}
              />
            )}
          </FormItem>
        )}
      />
    </div>
  );
};
