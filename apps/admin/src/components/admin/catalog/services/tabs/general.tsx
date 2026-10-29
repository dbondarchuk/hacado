import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  DurationInput,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useCurrencySymbol,
} from "@hacado/ui";
import { SwitchCardFormItem } from "@hacado/ui-admin";
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
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("catalog.services.form.details")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabelWithRequiredIndicator required>
                  {t("catalog.services.form.name")}
                </FormLabelWithRequiredIndicator>
                <FormControl>
                  <Input
                    disabled={disabled}
                    placeholder={t("catalog.services.form.namePlaceholder")}
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
                <FormLabelWithRequiredIndicator required>
                  {t("catalog.services.form.description")}
                </FormLabelWithRequiredIndicator>
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
                <FormDescription>
                  {t("catalog.services.form.descriptionTooltip")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("catalog.services.form.durationAndPrice")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="durationType"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabelWithRequiredIndicator required>
                  {t("catalog.services.form.durationType.label")}
                </FormLabelWithRequiredIndicator>
                <FormControl>
                  <RadioButtonGroup
                    joined
                    value={field.value}
                    disabled={disabled}
                    className="grid w-full grid-cols-2"
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
                  >
                    <RadioButtonGroupItem value="fixed" fullWidth>
                      {t("catalog.services.form.durationType.fixed")}
                    </RadioButtonGroupItem>
                    <RadioButtonGroupItem value="flexible" fullWidth>
                      {t("catalog.services.form.durationType.flexible")}
                    </RadioButtonGroupItem>
                  </RadioButtonGroup>
                </FormControl>
                <FormDescription>
                  {t("catalog.services.form.durationType.tooltip")}
                </FormDescription>
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
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.services.form.duration")}
                    </FormLabelWithRequiredIndicator>
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
                    <FormLabel>{t("catalog.services.form.price")}</FormLabel>
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
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.services.form.durationMin.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <DurationInput {...field} disabled={disabled} />
                    </FormControl>
                    <FormDescription>
                      {t("catalog.services.form.durationMin.tooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.services.form.durationMax.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <DurationInput {...field} disabled={disabled} />
                    </FormControl>
                    <FormDescription>
                      {t("catalog.services.form.durationMax.tooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationStep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.services.form.durationStep.label")}
                    </FormLabelWithRequiredIndicator>
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
                              "catalog.services.form.durationStep.placeholder",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {durationStepOptions.map((value) => (
                            <SelectItem key={value} value={value.toString()}>
                              {t(
                                `catalog.services.form.durationStep.steps.${value}`,
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      {t("catalog.services.form.durationStep.tooltip")}
                    </FormDescription>
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
                      {t("catalog.services.form.pricePerHour.label")}
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
                          {t("catalog.services.form.pricePerHour.suffix")}
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
                    <FormDescription>
                      {t("catalog.services.form.pricePerHour.tooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </CardContent>
      </Card>
      <FormField
        control={form.control}
        name="isAutoConfirm"
        render={({ field }) => {
          const customAutoConfirm = (field.value || "inherit") !== "inherit";

          return (
            <SwitchCardFormItem
              label={t("catalog.services.form.customAutoConfirm")}
              description={t("catalog.services.form.customAutoConfirmTooltip")}
              checked={customAutoConfirm}
              disabled={disabled}
              onCheckedChange={(checked) => {
                field.onChange(checked ? "always" : "inherit");
                field.onBlur();
              }}
            >
              {customAutoConfirm && (
                <RadioButtonGroup
                  joined
                  value={field.value}
                  disabled={disabled}
                  className="grid w-full grid-cols-2"
                  onValueChange={(value) => {
                    field.onChange(value);
                    field.onBlur();
                  }}
                >
                  <RadioButtonGroupItem value="always" fullWidth>
                    {t("catalog.services.form.isAutoConfirm.always")}
                  </RadioButtonGroupItem>
                  <RadioButtonGroupItem value="never" fullWidth>
                    {t("catalog.services.form.isAutoConfirm.never")}
                  </RadioButtonGroupItem>
                </RadioButtonGroup>
              )}
            </SwitchCardFormItem>
          );
        }}
      />
      <FormField
        control={form.control}
        name="isOnline"
        render={({ field }) => (
          <SwitchCardFormItem
            label={t("catalog.services.form.virtualAppointment")}
            description={t("catalog.services.form.virtualAppointmentTooltip")}
            checked={!!field.value}
            disabled={disabled}
            onCheckedChange={(checked) => {
              field.onChange(checked);
              field.onBlur();
            }}
          />
        )}
      />
    </div>
  );
};
