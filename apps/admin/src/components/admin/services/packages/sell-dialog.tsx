"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  AppointmentPackage,
  inPersonPaymentMethod,
  zObjectId,
} from "@hacado/types";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
  Spinner,
  toastPromise,
  useCurrencySymbol,
} from "@hacado/ui";
import { CustomerSelector, PackageSelector } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const sellSchema = z.object({
  packageId: zObjectId("validation.package.sell.packageId.required"),
  customerId: zObjectId("validation.package.sell.customerId.required"),
  price: z.coerce
    .number<number>("validation.package.sell.price.min")
    .min(0, "validation.package.sell.price.min"),
  paymentMethod: z.enum(inPersonPaymentMethod, {
    error: "validation.package.sell.paymentMethod.required",
  }),
});

type SellFormValues = z.infer<typeof sellSchema>;

export const SellPackageDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg?: AppointmentPackage;
  onSuccess?: (customerPackageId: string, packageId: string) => void;
}> = ({ open, onOpenChange, pkg, onSuccess }) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();
  const [loading, setLoading] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<
    AppointmentPackage | undefined
  >(pkg);

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellSchema),
    mode: "all",
    defaultValues: {
      packageId: pkg?._id ?? "",
      customerId: "",
      price: pkg?.price ?? 0,
      paymentMethod: "cash",
    },
  });

  const price = form.watch("price");

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      packageId: pkg?._id ?? "",
      customerId: "",
      price: pkg?.price ?? 0,
      paymentMethod: "cash",
    });
    setSelectedPackage(pkg);
  }, [open, pkg, form]);

  const applySelectedPackage = (next?: AppointmentPackage) => {
    if (next && next._id !== selectedPackage?._id) {
      form.setValue("price", next.price, { shouldValidate: true });
    }
    setSelectedPackage(next);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset();
      setSelectedPackage(pkg);
    }
    onOpenChange(next);
  };

  const onSubmit = async (values: SellFormValues) => {
    try {
      setLoading(true);
      let definition = selectedPackage;
      if (!definition || definition._id !== values.packageId) {
        definition = await adminApi.packages.getPackage(values.packageId);
      }
      if (!definition) return;

      let paymentId: string | undefined;
      if (values.price > 0) {
        const payment = await adminApi.payments.addInstore({
          amount: values.price,
          description: definition.name,
          type: "payment",
          method: values.paymentMethod,
          paidAt: new Date(),
          customerId: values.customerId,
          disableUpdate: true,
        });
        paymentId = payment._id;
      }
      const sold = await toastPromise(
        adminApi.packages.sellPackage(values.packageId, {
          customerId: values.customerId,
          paymentId,
          price: values.price,
        }),
        {
          success: t("services.packages.form.toasts.sold"),
          error: t("services.packages.form.toasts.requestError"),
        },
      );
      handleOpenChange(false);
      onSuccess?.(sold._id, values.packageId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("services.packages.sellTitle")}</DialogTitle>
          <DialogDescription>
            {t("services.packages.sellDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="sell-package-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="packageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("services.packages.sellForm.package")}
                    </FormLabel>
                    <FormControl>
                      <PackageSelector
                        disabled={loading || !!pkg}
                        value={field.value}
                        onItemSelect={field.onChange}
                        onValueChange={(next) =>
                          applySelectedPackage(next ?? pkg)
                        }
                      />
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
                    <FormLabel>
                      {t("services.packages.sellForm.price")}
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
                            type="number"
                            step={0.01}
                            min={0}
                            {...field}
                            disabled={loading || !selectedPackage}
                            className={InputGroupInputClasses({
                              variant: "prefix",
                            })}
                            onChange={(e) => {
                              const value = e.target.valueAsNumber;
                              field.onChange(
                                Number.isFinite(value) ? value : 0,
                              );
                            }}
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
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("services.packages.sellForm.customer")}
                    </FormLabel>
                    <FormControl>
                      <CustomerSelector
                        value={field.value}
                        onItemSelect={field.onChange}
                        allowClear={false}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {price > 0 ? (
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("services.packages.sellForm.paymentMethod")}
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {inPersonPaymentMethod.map((method) => (
                              <SelectItem key={method} value={method}>
                                {t(`common.labels.paymentMethod.${method}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={loading}>
                  {t("common.buttons.close")}
                </Button>
              </DialogClose>
              <Button type="submit" form="sell-package-form" disabled={loading}>
                {loading ? <Spinner className="w-4 h-4" /> : null}
                {t("services.packages.sell")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
