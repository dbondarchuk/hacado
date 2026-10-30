"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import {
  AppointmentPackage,
  AppointmentPackageUpdateModel,
  getAppointmentPackageSchemaWithUniqueCheck,
} from "@hacado/types/booking";
import { zObjectId } from "@hacado/types/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
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
  MonthsInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toastPromise,
  useCurrencySymbol,
  useDebounceCacheFn,
} from "@hacado/ui";
import { SaveButton, ServiceSelector } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { Resolver, useForm } from "react-hook-form";
import * as z from "zod";
import { EligibleStaff } from "./eligible-staff";

export const PackageForm: React.FC<{
  initialData?: AppointmentPackage;
}> = ({ initialData }) => {
  const t = useI18n("admin");
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const [loading, setLoading] = React.useState(false);
  const cachedUniqueNameCheck = useDebounceCacheFn(
    adminApi.packages.checkPackageUniqueName,
    300,
  );

  const formSchema = getAppointmentPackageSchemaWithUniqueCheck(
    (name) => cachedUniqueNameCheck(name, initialData?._id),
    "package.name.unique",
  ).extend({
    eligibleStaff: z.array(
      z.object({
        memberId: zObjectId("validation.package.eligibleMemberIds.required"),
      }),
    ),
  });

  type PackageFormValues = z.infer<typeof formSchema>;

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(formSchema) as Resolver<PackageFormValues>,
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
          items: [{ serviceId: "", credits: 10, creditsPerRedemption: 1 }],
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
          router.replace(`/dashboard/catalog/packages/${created._id}`);
        }
        router.refresh();
      };

      await toastPromise(save(), {
        success: t(
          initialData
            ? "catalog.packages.form.toasts.changesSaved"
            : "catalog.packages.form.toasts.created",
        ),
        error: t("catalog.packages.form.toasts.requestError"),
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
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("catalog.packages.form.details")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.packages.form.name.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder={t(
                          "catalog.packages.form.name.placeholder",
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("catalog.packages.form.name.tooltip")}
                    </FormDescription>
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
                      {t("catalog.packages.form.description.label")}
                    </FormLabelWithRequiredIndicator>
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
                    <FormDescription>
                      {t("catalog.packages.form.description.tooltip")}
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
                {t("catalog.packages.form.service")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="items.0.serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.packages.form.option.label")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <ServiceSelector
                        disabled={loading}
                        value={field.value}
                        onItemSelect={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("catalog.packages.form.option.tooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="items.0.credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("catalog.packages.form.credits.label")}
                    </FormLabelWithRequiredIndicator>
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
                          {t("catalog.packages.form.credits.suffix")}
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormDescription>
                      {t("catalog.packages.form.credits.tooltip")}
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
                {t("catalog.packages.form.priceAndLimits")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("catalog.packages.form.price.label")}
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
                              "catalog.packages.form.price.placeholder",
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
                    <FormDescription>
                      {t("catalog.packages.form.price.tooltip")}
                    </FormDescription>
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
                      {t("catalog.packages.form.maxPurchasesPerCustomer.label")}
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
                            "catalog.packages.form.maxPurchasesPerCustomer.suffix",
                          )}
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormDescription>
                      {t(
                        "catalog.packages.form.maxPurchasesPerCustomer.tooltip",
                      )}
                    </FormDescription>
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
                      {t("catalog.packages.form.validityMonths.label")}
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
                    <FormDescription>
                      {t("catalog.packages.form.validityMonths.tooltip")}
                    </FormDescription>
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
                      {t("catalog.packages.form.isAutoConfirm.label")}
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
                            placeholder={t(
                              "catalog.services.form.selectOption",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">
                            {t("catalog.packages.form.isAutoConfirm.always")}
                          </SelectItem>
                          <SelectItem value="never">
                            {t("catalog.packages.form.isAutoConfirm.never")}
                          </SelectItem>
                          <SelectItem value="inherit">
                            {t("catalog.packages.form.isAutoConfirm.inherit")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      {t("catalog.packages.form.isAutoConfirm.tooltip")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        <EligibleStaff form={form} disabled={loading} />
        <SaveButton form={form} isLoading={loading} />
      </form>
    </Form>
  );
};
