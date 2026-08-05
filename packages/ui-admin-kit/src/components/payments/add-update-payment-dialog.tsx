"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@hacado/api-sdk";
import { BaseAllKeys, useI18n } from "@hacado/i18n/client";
import {
  GiftCardListModel,
  giftCardPaymentMethod,
  inPersonPaymentMethod,
  InStorePaymentUpdateModel,
  inStorePaymentUpdateModelSchema,
  Payment,
  paymentType,
} from "@hacado/types";
import {
  Button,
  DateTimePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Textarea,
  toastPromise,
  use12HourFormat,
  useCurrencySymbol,
  useTimeZone,
} from "@hacado/ui";
import { CustomerSelector, GiftCardSelector } from "@hacado/ui-admin";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

type AddUpdatePaymentDialogProps = {
  onSuccess?: (payment: Payment) => void;
  children: React.ReactNode;
  amount?: number;
} & (
  | { appointmentId?: string; customerId: string }
  | { giftCardId: string }
  | {
      paymentId: string;
      payment: InStorePaymentUpdateModel;
    }
);

export const AddUpdatePaymentDialog = ({
  onSuccess,
  children: trigger,
  amount: propsAmount,
  ...props
}: AddUpdatePaymentDialogProps) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();
  const router = useRouter();

  const timeZone = useTimeZone();
  const uses12HourFormat = use12HourFormat();

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const defaultValues: z.infer<typeof inStorePaymentUpdateModelSchema> =
    "appointmentId" in props
      ? {
          appointmentId: props.appointmentId,
          customerId: props.customerId,
          amount: propsAmount ?? 0,
          description: "",
          paidAt: new Date(),
          method: "cash",
          type: "payment",
        }
      : "customerId" in props
        ? {
            customerId: props.customerId,
            appointmentId: undefined,
            amount: propsAmount ?? 0,
            description: "",
            paidAt: new Date(),
            method: "cash",
            type: "payment",
          }
        : "giftCardId" in props
          ? {
              giftCardId: props.giftCardId,
              customerId: "",
              amount: propsAmount ?? 0,
              description: "",
              paidAt: new Date(),
              method: "gift-card",
              type: "payment",
            }
          : ({
              ...props.payment,
            } as InStorePaymentUpdateModel);

  const onDialogOpenChange = (open: boolean) => {
    if (!open && loading) {
      return;
    }

    if (open) {
      form.reset(defaultValues);
    }

    setOpen(open);
  };

  const isEdit = "paymentId" in props;
  const [giftCard, setGiftCard] = useState<GiftCardListModel | undefined>(
    undefined,
  );

  const schema = useMemo(() => {
    return inStorePaymentUpdateModelSchema.superRefine((data, ctx) => {
      if (data.method === "gift-card") {
        if (!giftCard) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "validation.payments.giftCardId.required" satisfies BaseAllKeys,
            path: ["giftCardId"],
          });

          return;
        }

        if (!giftCard.amountLeft || giftCard.amountLeft < data.amount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "validation.payments.giftCardAmount.max" satisfies BaseAllKeys,
            path: ["amount"],
          });
        }
      }
    });
  }, [giftCard]);

  const form = useForm<z.infer<typeof inStorePaymentUpdateModelSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "all",
    reValidateMode: "onChange",
  });

  const originalMethod = isEdit ? props.payment.method : undefined;

  const method = form.watch("method");
  const allowedMethods = useMemo(() => {
    if (!isEdit) {
      return [...inPersonPaymentMethod, ...giftCardPaymentMethod];
    }

    if (originalMethod === "gift-card") {
      return giftCardPaymentMethod;
    }

    return inPersonPaymentMethod;
  }, [method, isEdit, originalMethod]);

  const onSubmit = async (
    data: z.infer<typeof inStorePaymentUpdateModelSchema>,
  ) => {
    try {
      setLoading(true);
      const result = await toastPromise(
        isEdit
          ? adminApi.payments.updateInstore(props.paymentId, data)
          : adminApi.payments.addInstore(data),
        {
          success: t("common.toasts.saved"),
          error: t("common.toasts.error"),
        },
      );

      setOpen(false);
      router.refresh();

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (method === "gift-card") {
      form.trigger("amount");
      form.trigger("giftCardId");
    }
  }, [method, form, giftCard]);

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("payment.addUpdatePayment.updatePayment")
              : t("payment.addUpdatePayment.addPayment")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("payment.addUpdatePayment.updatePaymentDescription")
              : t("payment.addUpdatePayment.addPaymentDescription")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="w-full flex flex-col gap-2 relative">
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payment.addUpdatePayment.form.method.label")}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          field.onBlur();
                        }}
                        disabled={loading || "giftCardId" in props}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t(
                              "payment.addUpdatePayment.form.method.label",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedMethods.map((type) => (
                            <SelectItem value={type} key={type}>
                              {t(
                                `payment.addUpdatePayment.form.method.${type}`,
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
              {method === "gift-card" && (
                <>
                  <FormField
                    control={form.control}
                    name="giftCardId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("payment.addUpdatePayment.form.giftCardId.label")}
                        </FormLabel>
                        <FormControl>
                          <GiftCardSelector
                            onItemSelect={(value) => {
                              field.onChange(value);
                              field.onBlur();
                            }}
                            value={field.value}
                            onValueChange={(value) => {
                              setGiftCard(value);
                              form.trigger("amount");
                            }}
                            disabled={loading}
                          />
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
                          {t("payment.addUpdatePayment.form.customerId.label")}
                        </FormLabel>
                        <FormControl>
                          <CustomerSelector
                            onItemSelect={(value: string) => {
                              field.onChange(value);
                              field.onBlur();
                            }}
                            value={field.value}
                            disabled={loading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payment.addUpdatePayment.form.amount")}
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
                            {...field}
                            disabled={loading}
                            type="number"
                            className={InputGroupInputClasses({
                              variant: "prefix",
                            })}
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payment.addUpdatePayment.form.type.label")}
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
                              "payment.addUpdatePayment.form.type.label",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentType.map((type) => (
                            <SelectItem value={type} key={type}>
                              {t(`payment.types.${type}`)}
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
                name="paidAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("payment.addUpdatePayment.form.paidAt")}
                    </FormLabel>
                    <FormControl>
                      <DateTimePicker
                        use12HourFormat={uses12HourFormat}
                        disabled={loading}
                        // min={new Date()}
                        timeZone={timeZone}
                        {...field}
                        className="flex w-full"
                        minutesDivisibleBy={5}
                        commitOnChange
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
                  <FormItem>
                    <FormLabel>
                      {t("payment.addUpdatePayment.form.description")}
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={loading} autoResize />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onDialogOpenChange(false)}>
            {t("common.buttons.close")}
          </Button>
          <Button variant="primary" onClick={form.handleSubmit(onSubmit)}>
            {loading ? <Spinner /> : null}
            {isEdit ? t("common.buttons.update") : t("common.buttons.addNew")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
