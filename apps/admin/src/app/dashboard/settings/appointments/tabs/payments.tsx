import { FeatureUpgradeHint } from "@/lib/billing/feature-upgrade-hint";
import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import {
  BooleanSelect,
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
  useCurrencySymbol,
} from "@hacado/ui";
import { TabProps } from "./types";

export const PaymentsTab: React.FC<TabProps & { canUsePayments?: boolean }> = ({
  form,
  disabled,
  canUsePayments = true,
}) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();
  const enablePayments = form.watch("payments.enabled");
  const requireDeposit = form.watch("payments.requireDeposit");
  const depositPercentage = form.watch("payments.depositPercentage");
  return (
    <div className="gap-2 grid grid-cols-1 md:grid-cols-2 md:gap-4 w-full">
      {/* <div className="flex flex-col gap-2"> */}
      <FormField
        control={form.control}
        name="payments.enabled"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.payments.enableDeposits")}{" "}
              <InfoTooltip>
                {t("settings.appointments.form.payments.enableDepositsTooltip")}
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <BooleanSelect
                value={field.value}
                disabled={!canUsePayments || disabled}
                onValueChange={(val) => {
                  if (!canUsePayments) return;
                  field.onChange(val);
                  field.onBlur();
                }}
                className="w-full"
                trueLabel={t("settings.appointments.form.payments.enable")}
                falseLabel={t("settings.appointments.form.payments.disable")}
              />
            </FormControl>
            {!canUsePayments ? <FeatureUpgradeHint /> : null}
            <FormMessage />
          </FormItem>
        )}
      />
      {enablePayments && canUsePayments && (
        <>
          {/* <div className="gap-2 flex flex-col md:grid md:grid-cols-2 md:gap-4 w-full"> */}
          <FormField
            control={form.control}
            name="payments.requireDeposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("settings.appointments.form.payments.requireDeposit")}{" "}
                  <InfoTooltip>
                    <p>
                      {t(
                        "settings.appointments.form.payments.requireDepositTooltip1",
                      )}
                    </p>
                    <p>
                      {t(
                        "settings.appointments.form.payments.requireDepositTooltip2",
                      )}
                    </p>
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <BooleanSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    className="w-full"
                    trueLabel={t("settings.appointments.form.payments.require")}
                    falseLabel={t(
                      "settings.appointments.form.payments.doNotRequire",
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {requireDeposit && (
            <>
              <FormField
                control={form.control}
                name="payments.depositPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.appointments.form.payments.depositAmount")}{" "}
                      <InfoTooltip>
                        <I18nRichText
                          namespace="admin"
                          text="settings.appointments.form.payments.depositAmountTooltip"
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
              <FormField
                control={form.control}
                name="payments.dontRequireIfCompletedMinNumberOfAppointments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "settings.appointments.form.payments.dontRequireIfCompletedMinNumberOfAppointments",
                      )}{" "}
                      <InfoTooltip>
                        <I18nRichText
                          namespace="admin"
                          text="settings.appointments.form.payments.dontRequireIfCompletedMinNumberOfAppointmentsTooltip"
                        />
                      </InfoTooltip>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="payments.fullPaymentAmountThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t(
                    "settings.appointments.form.payments.fullPaymentAmountThreshold",
                  )}{" "}
                  <InfoTooltip>
                    <I18nRichText
                      namespace="admin"
                      text="settings.appointments.form.payments.fullPaymentAmountThresholdTooltip"
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
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );
};
