"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import {
  AppointmentPackage,
  appointmentPackageSchema,
  AppointmentPackageUpdateModel,
  zObjectId,
} from "@hacado/types";
import {
  Form,
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
  MonthsInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toastPromise,
  useCurrencySymbol,
} from "@hacado/ui";
import { OptionSelector, SaveButton } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Resolver, useForm } from "react-hook-form";
import * as z from "zod";
import { EligibleStaff } from "./eligible-staff";

const packageFormSchema = appointmentPackageSchema
  .omit({ eligibleMemberIds: true, isPublic: true })
  .extend({
    eligibleStaff: z.array(
      z.object({
        memberId: zObjectId("validation.package.eligibleMemberIds.required"),
      }),
    ),
  });

type PackageFormValues = z.infer<typeof packageFormSchema>;

export const PackageForm: React.FC<{
  initialData?: AppointmentPackage;
}> = ({ initialData }) => {
  const t = useI18n("admin");
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema) as Resolver<PackageFormValues>,
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          price: initialData.price,
          items: initialData.items,
          validityMonths: initialData.validityMonths,
          maxPurchasesPerCustomer: initialData.maxPurchasesPerCustomer,
          eligibleStaff: (initialData.eligibleMemberIds ?? []).map(
            (memberId) => ({ memberId }),
          ),
          isAutoConfirm: initialData.isAutoConfirm ?? "inherit",
        }
      : {
          name: "",
          description: "",
          price: 0,
          items: [{ optionId: "", credits: 10, creditsPerRedemption: 1 }],
          eligibleStaff: [],
          isAutoConfirm: "inherit",
        },
  });

  const toPayload = (
    data: PackageFormValues,
  ): AppointmentPackageUpdateModel => ({
    name: data.name,
    description: data.description,
    price: data.price,
    items: data.items,
    validityMonths: data.validityMonths,
    maxPurchasesPerCustomer: data.maxPurchasesPerCustomer,
    eligibleMemberIds: data.eligibleStaff
      .map((staff) => staff.memberId)
      .filter(Boolean),
    isPublic: true,
    isAutoConfirm: data.isAutoConfirm,
  });

  const onSubmit = async (data: PackageFormValues) => {
    try {
      setLoading(true);
      const payload = toPayload(data);
      const save = async () => {
        if (initialData) {
          await adminApi.packages.updatePackage(initialData._id, payload);
        } else {
          const created = await adminApi.packages.createPackage(payload);
          router.replace(`/dashboard/services/packages/${created._id}`);
        }
        router.refresh();
      };

      await toastPromise(save(), {
        success: t(
          initialData
            ? "services.packages.form.toasts.changesSaved"
            : "services.packages.form.toasts.created",
        ),
        error: t("services.packages.form.toasts.requestError"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full min-w-0 space-y-8"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.packages.form.name.label")}{" "}
                  <InfoTooltip>
                    {t("services.packages.form.name.tooltip")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder={t("services.packages.form.name.placeholder")}
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
                  {t("services.packages.form.description.label")}{" "}
                  <InfoTooltip>
                    {t("services.packages.form.description.tooltip")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <PlateMarkdownEditor
                    className="bg-background px-4 sm:px-4 pb-24"
                    disabled={loading}
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
          <FormField
            control={form.control}
            name="items.0.optionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("services.packages.form.option.label")}{" "}
                  <InfoTooltip>
                    {t("services.packages.form.option.tooltip")}
                  </InfoTooltip>
                </FormLabel>
                <FormControl>
                  <OptionSelector
                    disabled={loading}
                    value={field.value}
                    onItemSelect={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.packages.form.price.label")}{" "}
                    <InfoTooltip>
                      {t("services.packages.form.price.tooltip")}
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
                          disabled={loading}
                          placeholder={t(
                            "services.packages.form.price.placeholder",
                          )}
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
              name="items.0.credits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.packages.form.credits.label")}{" "}
                    <InfoTooltip>
                      {t("services.packages.form.credits.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput>
                        <Input
                          disabled={loading}
                          type="number"
                          min={1}
                          className={InputGroupInputClasses()}
                          {...field}
                        />
                      </InputGroupInput>
                      <InputGroupAddon className={InputGroupAddonClasses()}>
                        {t("services.packages.form.credits.suffix")}
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxPurchasesPerCustomer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.packages.form.maxPurchasesPerCustomer.label")}{" "}
                    <InfoTooltip>
                      {t(
                        "services.packages.form.maxPurchasesPerCustomer.tooltip",
                      )}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput>
                        <Input
                          disabled={loading}
                          type="number"
                          min={1}
                          className={InputGroupInputClasses()}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : e.target.valueAsNumber,
                            )
                          }
                        />
                      </InputGroupInput>
                      <InputGroupAddon className={InputGroupAddonClasses()}>
                        {t(
                          "services.packages.form.maxPurchasesPerCustomer.suffix",
                        )}
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validityMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.packages.form.validityMonths.label")}{" "}
                    <InfoTooltip>
                      {t("services.packages.form.validityMonths.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <MonthsInput
                      disabled={loading}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        form.trigger("validityMonths");
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isAutoConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("services.packages.form.isAutoConfirm.label")}{" "}
                    <InfoTooltip>
                      {t("services.packages.form.isAutoConfirm.tooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("services.options.form.selectOption")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="always">
                          {t("services.packages.form.isAutoConfirm.always")}
                        </SelectItem>
                        <SelectItem value="never">
                          {t("services.packages.form.isAutoConfirm.never")}
                        </SelectItem>
                        <SelectItem value="inherit">
                          {t("services.packages.form.isAutoConfirm.inherit")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <EligibleStaff form={form} disabled={loading} />
        <SaveButton form={form} isLoading={loading} />
      </form>
    </Form>
  );
};
