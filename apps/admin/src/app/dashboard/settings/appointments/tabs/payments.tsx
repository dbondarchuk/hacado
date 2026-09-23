import { FeatureUpgradeHint } from "@/lib/billing/feature-upgrade-hint";
import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import { bookingTipsModes } from "@hacado/types";
import {
  BooleanSelect,
  Button,
  FormControl,
  FormDescription,
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
import { Plus, Trash2 } from "lucide-react";
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
  const tipPresets = form.watch("payments.tipPresets") ?? [];

  if (!canUsePayments) {
    return (
      <div className="gap-2 grid grid-cols-1 md:grid-cols-2 md:gap-4 w-full">
        <FeatureUpgradeHint />
      </div>
    );
  }

  return (
    <div className="gap-2 grid grid-cols-1 md:grid-cols-2 md:gap-4 w-full">
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
                disabled={disabled}
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
                      {t("settings.appointments.form.payments.appointments")}
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

      <FormField
        control={form.control}
        name="payments.tipsMode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("settings.appointments.form.payments.tipsMode.label")}{" "}
              <InfoTooltip>
                {t("settings.appointments.form.payments.tipsMode.tooltip")}
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <Select
                value={field.value ?? "off"}
                disabled={disabled}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "off") {
                    form.setValue("payments.tipPresets", [], {
                      shouldValidate: true,
                    });
                  } else if (
                    !(form.getValues("payments.tipPresets") ?? []).length
                  ) {
                    form.setValue("payments.tipPresets", [15, 18, 20], {
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
                  {bookingTipsModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {t(
                        `settings.appointments.form.payments.tipsMode.values.${mode}`,
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

      {tipsMode !== "off" && (
        <div className="flex flex-col gap-2 md:col-span-2">
          <FormLabel>
            {t("settings.appointments.form.payments.tipPresets.label")}
          </FormLabel>
          <FormDescription>
            {t("settings.appointments.form.payments.tipPresets.description")}
          </FormDescription>
          {tipPresets.map((_preset, index) => (
            <FormField
              key={`org-tip-preset-${index}`}
              control={form.control}
              name={`payments.tipPresets.${index}` as const}
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-row items-center gap-2">
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            disabled={disabled}
                            className={InputGroupInputClasses()}
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              field.onChange(
                                raw === "" ? undefined : Number(raw),
                              );
                            }}
                            onBlur={field.onBlur}
                          />
                        </InputGroupInput>
                        <InputGroupAddon className={InputGroupAddonClasses()}>
                          {t(
                            "settings.appointments.form.payments.tipPresets.percentage",
                          )}
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      aria-label={t(
                        "settings.appointments.form.payments.tipPresets.remove",
                      )}
                      onClick={() => {
                        const next = [...tipPresets];
                        next.splice(index, 1);
                        form.setValue("payments.tipPresets", next, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          {tipPresets.length < 4 && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="inline-flex items-center gap-2 self-start"
              onClick={() => {
                form.setValue("payments.tipPresets", [...tipPresets, 15], {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            >
              <Plus className="size-4" />
              {t("settings.appointments.form.payments.tipPresets.add")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
