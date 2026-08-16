import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import {
  BooleanSelect,
  Button,
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
} from "@hacado/ui";
import { X } from "lucide-react";
import React from "react";
import { TabProps } from "./types";

const durationStepOptions = [1, 5, 10, 15, 20, 30, 60, 120, 180, 360] as const;

export const GeneralTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();

  const durationType = form.watch("durationType");

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("services.options.form.name")}</FormLabel>
            <FormControl>
              <Input
                disabled={disabled}
                placeholder={t("services.options.form.namePlaceholder")}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem className="min-w-0">
            <FormLabel>
              {t("services.options.form.description")}{" "}
              <InfoTooltip>
                {t("services.options.form.descriptionTooltip")}
              </InfoTooltip>
            </FormLabel>
            <FormControl>
              <PlateMarkdownEditor
                className="bg-background px-4 sm:px-4 pb-24"
                disabled={disabled}
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  field.onBlur();
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
        <FormField
          control={form.control}
          name="isAutoConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("services.options.form.isAutoConfirm.label")}{" "}
                <InfoTooltip>
                  {t("services.options.form.isAutoConfirm.tooltip")}
                </InfoTooltip>
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
                    <SelectValue
                      placeholder={t("services.options.form.selectOption")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">
                      {t("services.options.form.isAutoConfirm.always")}
                    </SelectItem>
                    <SelectItem value="never">
                      {t("services.options.form.isAutoConfirm.never")}
                    </SelectItem>
                    <SelectItem value="inherit">
                      {t("services.options.form.isAutoConfirm.inherit")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="durationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("services.options.form.durationType.label")}
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);

                    if (value === "fixed") {
                      form.setValue("duration", 30, { shouldValidate: true });
                      form.trigger("duration");
                    } else {
                      form.setValue("durationMin", 15, {
                        shouldValidate: true,
                      });
                      form.trigger("durationMin");

                      form.setValue("durationMax", 4 * 60, {
                        shouldValidate: true,
                      });
                      form.trigger("durationMax");

                      form.setValue("durationStep", 15, {
                        shouldValidate: true,
                      });
                      form.trigger("durationStep");

                      // Duration overrides only apply to fixed services.
                      const staff = form.getValues("staff") ?? [];
                      form.setValue(
                        "staff",
                        staff.map(
                          ({
                            durationOverride: _durationOverride,
                            ...assignment
                          }: {
                            memberId: string;
                            priceOverride?: number;
                            durationOverride?: number;
                          }) => assignment,
                        ),
                      );
                    }

                    field.onBlur();
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "services.options.form.durationType.placeholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">
                      {t("services.options.form.durationType.fixed")}
                    </SelectItem>
                    <SelectItem value="flexible">
                      {t("services.options.form.durationType.flexible")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {durationType === "fixed" && (
          <>
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("services.options.form.duration")}</FormLabel>
                  <FormControl>
                    <DurationInput {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("services.options.form.price")}</FormLabel>
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
                          placeholder="0.00"
                          type="number"
                          className={cn(
                            InputGroupInputClasses({
                              variant: "prefix",
                            }),
                            "rounded-r-none",
                          )}
                          {...field}
                        />
                      </InputGroupInput>

                      <Button
                        variant="outline"
                        className="rounded-l-none border-l-0"
                        onClick={() => {
                          field.onChange("");
                          field.onBlur();
                        }}
                      >
                        <X className="w-4 h-4 opacity-50" />
                      </Button>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        {durationType === "flexible" && (
          <>
            <FormField
              control={form.control}
              name="durationMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.options.form.durationMin.label")}{" "}
                    <InfoTooltip>
                      {t("services.options.form.durationMin.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <DurationInput {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.options.form.durationMax.label")}{" "}
                    <InfoTooltip>
                      {t("services.options.form.durationMax.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <DurationInput {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationStep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.options.form.durationStep.label")}{" "}
                    <InfoTooltip>
                      {t("services.options.form.durationStep.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={(value) => {
                        field.onChange(parseInt(value));
                        field.onBlur();
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            "services.options.form.durationStep.placeholder",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {durationStepOptions.map((value) => (
                          <SelectItem key={value} value={value.toString()}>
                            {t(
                              `services.options.form.durationStep.steps.${value}`,
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
            <FormField
              control={form.control}
              name="pricePerHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.options.form.pricePerHour.label")}{" "}
                    <InfoTooltip>
                      {t("services.options.form.pricePerHour.tooltip")}
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
                          placeholder="0.00"
                          type="number"
                          className={cn(
                            InputGroupInputClasses({
                              variant: "prefix",
                            }),
                            InputGroupInputClasses({
                              variant: "suffix",
                            }),
                          )}
                          {...field}
                        />
                      </InputGroupInput>
                      <InputGroupAddon
                        className={cn(
                          InputGroupAddonClasses({
                            variant: "suffix",
                          }),
                          "rounded-r-none",
                        )}
                      >
                        {t("services.options.form.pricePerHour.suffix")}
                      </InputGroupAddon>

                      <Button
                        variant="outline"
                        className="rounded-l-none border-l-0"
                        onClick={() => {
                          field.onChange("");
                          field.onBlur();
                        }}
                      >
                        <X className="w-4 h-4 opacity-50" />
                      </Button>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="isOnline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.options.form.onlineSettings.isOnline.label")}{" "}
                  <InfoTooltip>
                    {t("services.options.form.onlineSettings.isOnline.tooltip")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <BooleanSelect
                    value={field.value}
                    trueLabel={t(
                      "services.options.form.onlineSettings.isOnline.labels.true",
                    )}
                    falseLabel={t(
                      "services.options.form.onlineSettings.isOnline.labels.false",
                    )}
                    onValueChange={(value) => {
                      field.onChange(value);
                      field.onBlur();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
